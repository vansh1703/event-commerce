import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

// ✅ ADD THIS: GET method to fetch red flags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const seekerId = searchParams.get('seekerId');

    let query = supabaseAdmin.from('red_flags').select('*');

    // Filter by jobId if provided
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    // Filter by seekerId if provided
    if (seekerId) {
      query = query.eq('seeker_id', seekerId);
    }

    const { data: redFlags, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      redFlags: redFlags || [] 
    });
  } catch (error: any) {
    console.error('Error fetching red flags:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ EXISTING POST METHOD (keep as is)
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