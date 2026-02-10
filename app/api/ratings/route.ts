import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { seekerId, jobId, jobTitle, stars } = await request.json();

    // Check if already rated for this job
    const { data: existing } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('seeker_id', seekerId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already rated this seeker for this job' },
        { status: 400 }
      );
    }

    // Create rating
    const { data: rating, error } = await supabaseAdmin
      .from('ratings')
      .insert({
        seeker_id: seekerId,
        job_id: jobId,
        job_title: jobTitle,
        stars,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, rating });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}