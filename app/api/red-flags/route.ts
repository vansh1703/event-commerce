// app/api/red-flags/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { seekerId, jobId, jobTitle, reason } = await request.json();

    const { data, error } = await supabase
      .from('red_flags')
      .insert({
        seeker_id: seekerId,
        job_id: jobId,
        job_title: jobTitle,
        reason,
        date: new Date().toLocaleDateString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already flagged this seeker for this job' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check if should ban (3+ flags)
    const { data: allFlags } = await supabase
      .from('red_flags')
      .select('*')
      .eq('seeker_id', seekerId);

    if (allFlags && allFlags.length >= 3) {
      const banDate = new Date();
      banDate.setDate(banDate.getDate() + 30);

      await supabase
        .from('seeker_bans')
        .upsert({
          seeker_id: seekerId,
          banned_until: banDate.toISOString(),
        });
    }

    return NextResponse.json({ success: true, redFlag: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}