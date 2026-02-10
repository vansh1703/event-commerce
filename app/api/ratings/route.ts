// app/api/ratings/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { seekerId, jobId, jobTitle, stars } = await request.json();

    const { data, error } = await supabase
      .from('ratings')
      .insert({
        seeker_id: seekerId,
        job_id: jobId,
        job_title: jobTitle,
        stars,
        date: new Date().toLocaleDateString(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'You have already rated this seeker for this job' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, rating: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}