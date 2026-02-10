import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { seekerId, jobId, jobTitle, reason } = await request.json();

    // Add red flag
    const { data: redFlag, error } = await supabaseAdmin
      .from('red_flags')
      .insert({
        seeker_id: seekerId,
        job_id: jobId,
        job_title: jobTitle,
        reason,
        date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Count total red flags
    const { data: allFlags } = await supabaseAdmin
      .from('red_flags')
      .select('*')
      .eq('seeker_id', seekerId);

    // If 3 or more red flags, ban for 30 days
    if (allFlags && allFlags.length >= 3) {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + 30);

      // Check if already banned
      const { data: existingBan } = await supabaseAdmin
        .from('seeker_bans')
        .select('*')
        .eq('seeker_id', seekerId)
        .maybeSingle();

      if (existingBan) {
        // Update existing ban
        await supabaseAdmin
          .from('seeker_bans')
          .update({ banned_until: bannedUntil.toISOString() })
          .eq('seeker_id', seekerId);
      } else {
        // Create new ban
        await supabaseAdmin
          .from('seeker_bans')
          .insert({
            seeker_id: seekerId,
            banned_until: bannedUntil.toISOString(),
          });
      }
    }

    return NextResponse.json({ success: true, redFlag });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}