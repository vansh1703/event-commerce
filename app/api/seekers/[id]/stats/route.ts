import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const seekerId = params.id;

    // Get ratings
    const { data: ratings } = await supabaseAdmin
      .from('ratings')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('date', { ascending: false });

    // Get red flags
    const { data: redFlags } = await supabaseAdmin
      .from('red_flags')
      .select('*')
      .eq('seeker_id', seekerId)
      .order('date', { ascending: false });

    // Get ban status
    const { data: ban } = await supabaseAdmin
      .from('seeker_bans')
      .select('*')
      .eq('seeker_id', seekerId)
      .maybeSingle();

    // Calculate average rating
    const avgRating =
      ratings && ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
        : '0';

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
    console.error('Stats error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}