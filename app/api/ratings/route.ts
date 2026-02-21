import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { NextRequest } from 'next/server';

// ✅ ADD THIS: GET method to fetch ratings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const seekerId = searchParams.get('seekerId');

    let query = supabaseAdmin.from('ratings').select('*');

    // Filter by jobId if provided
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    // Filter by seekerId if provided
    if (seekerId) {
      query = query.eq('seeker_id', seekerId);
    }

    const { data: ratings, error } = await query.order('date', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      ratings: ratings || [] 
    });
  } catch (error: any) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ✅ EXISTING POST METHOD (keep as is)
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