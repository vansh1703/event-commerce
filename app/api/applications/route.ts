import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      jobId,
      seekerId,
      name,
      phone,
      age,
      city,
      experience,
      availability,
    } = body;

    // Check if banned
    const { data: ban } = await supabaseAdmin
      .from('seeker_bans')
      .select('*')
      .eq('seeker_id', seekerId)
      .single();

    if (ban && new Date(ban.banned_until) > new Date()) {
      return NextResponse.json(
        { error: `You are banned until ${ban.banned_until}` },
        { status: 403 }
      );
    }

    // Check if job is archived
    const { data: job } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (job?.archived) {
      return NextResponse.json(
        { error: 'This job is no longer accepting applications' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id: jobId,
        seeker_id: seekerId,
        name,
        phone,
        age,
        city,
        experience,
        availability,
        status: 'pending',
        applied_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already applied for this job' },
          { status: 400 }
        );
      }
      throw error;
    }

    // ✅ AUTO-ARCHIVE LOGIC
    if (job) {
      const { data: allApps } = await supabaseAdmin
        .from('applications')
        .select('id')
        .eq('job_id', jobId);

      const totalApps = allApps?.length || 0;
      const threshold = job.helpers_needed * 2;

      if (totalApps >= threshold) {
        await supabaseAdmin
          .from('jobs')
          .update({ archived: true })
          .eq('id', jobId);

        console.log(`✅ Job ${jobId} auto-archived: ${totalApps}/${threshold} applications`);
      }
    }

    return NextResponse.json({ success: true, application: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET method stays the same...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const seekerId = searchParams.get('seekerId');

    let query = supabaseAdmin.from('applications').select('*');

    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (seekerId) {
      query = query.eq('seeker_id', seekerId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, applications: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}