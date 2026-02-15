import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyNewApplication } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to add/subtract days from a date
function addDays(dateString: string, days: number): Date {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date;
}

// Helper function to check if date ranges overlap (with buffer)
function dateRangesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string,
  bufferDays: number = 1
): boolean {
  const bufferedStart1 = addDays(start1, -bufferDays);
  const bufferedEnd1 = addDays(end1, bufferDays);
  const bufferedStart2 = addDays(start2, -bufferDays);
  const bufferedEnd2 = addDays(end2, bufferDays);

  return bufferedStart1 <= bufferedEnd2 && bufferedStart2 <= bufferedEnd1;
}

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
      custom_data: app.custom_data || {},
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
      customData,
    } = body;

    // Validate required fields
    if (!jobId || !seekerId || !name || !phone || !age || !city || !experience || !availability) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get job details (including date range and company info)
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .select('archived, completed, helpers_needed, event_start_date, event_end_date, title, company_name')
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

    // CHECK FOR DATE CONFLICTS WITH ACCEPTED JOBS
    const { data: acceptedApplications, error: acceptedError } = await supabaseAdmin
      .from('applications')
      .select('job_id')
      .eq('seeker_id', seekerId)
      .eq('status', 'accepted');

    if (acceptedError) throw acceptedError;

    if (acceptedApplications && acceptedApplications.length > 0) {
      const acceptedJobIds = acceptedApplications.map(app => app.job_id);
      
      const { data: acceptedJobs, error: acceptedJobsError } = await supabaseAdmin
        .from('jobs')
        .select('id, event_start_date, event_end_date, title')
        .in('id', acceptedJobIds);

      if (acceptedJobsError) throw acceptedJobsError;

      for (const acceptedJob of acceptedJobs || []) {
        if (dateRangesOverlap(
          job.event_start_date,
          job.event_end_date,
          acceptedJob.event_start_date,
          acceptedJob.event_end_date,
          1
        )) {
          return NextResponse.json(
            { 
              success: false, 
              error: `You already have an accepted job "${acceptedJob.title}" that conflicts with this date range (including buffer days). You cannot apply for overlapping jobs.` 
            },
            { status: 400 }
          );
        }
      }
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

    // Insert application
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
        custom_data: customData || {},
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ SEND EMAIL NOTIFICATION TO SUPERADMIN
    try {
      const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'newa1703@gmail.com';
      
      await notifyNewApplication(
        superAdminEmail,
        name,
        job.title,
        job.company_name
      );
      
      console.log('✅ Application email sent to SuperAdmin:', superAdminEmail);
    } catch (emailError) {
      console.error('❌ Email notification failed:', emailError);
      // Don't fail the application if email fails
    }

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