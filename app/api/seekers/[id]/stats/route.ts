// app/api/seekers/[id]/stats/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get ratings
    const { data: ratings } = await supabase
      .from('ratings')
      .select('*')
      .eq('seeker_id', params.id);

    // Get red flags
    const { data: redFlags } = await supabase
      .from('red_flags')
      .select('*')
      .eq('seeker_id', params.id);

    // Get ban status
    const { data: ban } = await supabase
      .from('seeker_bans')
      .select('*')
      .eq('seeker_id', params.id)
      .single();

    const avgRating =
      ratings && ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
        : 0;

    const isBanned = ban ? new Date(ban.banned_until) > new Date() : false;

    return NextResponse.json({
      success: true,
      stats: {
        avgRating,
        ratings: ratings || [],
        redFlags: redFlags || [],
        redFlagCount: redFlags?.length || 0,
        isBanned,
        bannedUntil: ban?.banned_until || null,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}