import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
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

    const formattedApplications = data.map((app: any) => ({
      id: app.id,
      job_id: app.job_id,
      seeker_id: app.seeker_id,
      name: app.name,
      phone: app.phone,
      age: app.age,
      city: app.city,
      experience: app.experience,
      availability: app.availability,
      status: app.status,
      applied_at: app.applied_at,
      custom_data: app.custom_data || {}, // ✅ Include custom data
    }));

    return NextResponse.json({
      success: true,
      applications: formattedApplications,
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      customData, // ✅ Receive custom data
    } = body;

    // Validate required fields
    if (!jobId || !seekerId || !name || !phone || !age || !city || !experience || !availability) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if job exists and is not archived/completed
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('archived, completed, helpers_needed')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (job.archived) {
      return NextResponse.json(
        { success: false, error: 'This job is archived and no longer accepting applications' },
        { status: 400 }
      );
    }

    if (job.completed) {
      return NextResponse.json(
        { success: false, error: 'This job is completed and no longer accepting applications' },
        { status: 400 }
      );
    }

    // Check if already applied
    const { data: existingApp } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('seeker_id', seekerId)
      .single();

    if (existingApp) {
      return NextResponse.json(
        { success: false, error: 'You have already applied for this job' },
        { status: 400 }
      );
    }

    // Check application limit (2x helpers needed)
    const { data: applications } = await supabaseAdmin
      .from('applications')
      .select('id')
      .eq('job_id', jobId);

    if (applications && applications.length >= job.helpers_needed * 2) {
      return NextResponse.json(
        { success: false, error: 'This job has reached maximum applications' },
        { status: 400 }
      );
    }

    const appliedAt = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // ✅ Insert application WITH custom data
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
        applied_at: appliedAt,
        custom_data: customData || {}, // ✅ Store custom data
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      application: data,
    });
  } catch (error: any) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('id');

    if (!applicationId) {
      return NextResponse.json(
        { success: false, error: 'Application ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Application withdrawn successfully',
    });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}