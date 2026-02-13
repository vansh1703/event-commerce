import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ✅ Helper function to add/subtract days from a date
function addDays(dateString: string, days: number): Date {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date;
}

// ✅ Helper function to check if date ranges overlap (with buffer)
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Get the application details
    const { data: application, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, job_id, seeker_id')
      .eq('id', applicationId)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      );
    }

    // ✅ If accepting application, implement auto-withdraw logic
    if (status === 'accepted') {
      // Get the job details for this application
      const { data: acceptedJob, error: jobError } = await supabaseAdmin
        .from('jobs')
        .select('id, event_start_date, event_end_date, helpers_needed, archived')
        .eq('id', application.job_id)
        .single();

      if (jobError || !acceptedJob) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }

      // Get all OTHER applications by this seeker (pending status only)
      const { data: otherApplications, error: otherAppsError } = await supabaseAdmin
        .from('applications')
        .select('id, job_id')
        .eq('seeker_id', application.seeker_id)
        .eq('status', 'pending')
        .neq('id', applicationId); // Exclude current application

      if (otherAppsError) throw otherAppsError;

      if (otherApplications && otherApplications.length > 0) {
        // Get job details for all other applications
        const otherJobIds = otherApplications.map(app => app.job_id);
        
        const { data: otherJobs, error: otherJobsError } = await supabaseAdmin
          .from('jobs')
          .select('id, event_start_date, event_end_date')
          .in('id', otherJobIds);

        if (otherJobsError) throw otherJobsError;

        // ✅ AUTO-WITHDRAW overlapping applications
        const applicationsToWithdraw: string[] = [];

        for (const otherApp of otherApplications) {
          const otherJob = otherJobs?.find(j => j.id === otherApp.job_id);
          
          if (otherJob && dateRangesOverlap(
            acceptedJob.event_start_date,
            acceptedJob.event_end_date,
            otherJob.event_start_date,
            otherJob.event_end_date,
            1 // ✅ 1 day buffer
          )) {
            applicationsToWithdraw.push(otherApp.id);
          }
        }

        // Delete conflicting applications
        if (applicationsToWithdraw.length > 0) {
          const { error: deleteError } = await supabaseAdmin
            .from('applications')
            .delete()
            .in('id', applicationsToWithdraw);

          if (deleteError) {
            console.error('Error auto-withdrawing applications:', deleteError);
          } else {
            console.log(`✅ Auto-withdrew ${applicationsToWithdraw.length} conflicting applications`);
          }
        }
      }

      // ✅ Check if job should be auto-archived
      if (!acceptedJob.archived) {
        const { data: acceptedApps } = await supabaseAdmin
          .from('applications')
          .select('id')
          .eq('job_id', acceptedJob.id)
          .eq('status', 'accepted');

        const acceptedCount = (acceptedApps?.length || 0) + 1; // +1 for current acceptance

        if (acceptedCount >= acceptedJob.helpers_needed) {
          await supabaseAdmin
            .from('jobs')
            .update({ archived: true })
            .eq('id', acceptedJob.id);

          console.log(`✅ Job auto-archived (fully staffed)`);
        }
      }
    }

    // Update the application status
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      application: data,
    });
  } catch (error: any) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await context.params;

    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting application:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}