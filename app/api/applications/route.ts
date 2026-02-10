import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { jobId, seekerId, name, phone, age, city, experience, availability } = await request.json();

    // Check if seeker is banned
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

    // Check if already applied
    const { data: existing } = await supabaseAdmin
      .from('applications')
      .select('*')
      .eq('job_id', jobId)
      .eq('seeker_id', seekerId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Create application
    const { data: application, error } = await supabaseAdmin
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

    if (error) throw error;

    return NextResponse.json({ success: true, application });
  } catch (error: any) {
    console.error('Application error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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

    const { data: applications, error } = await query.order('applied_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}