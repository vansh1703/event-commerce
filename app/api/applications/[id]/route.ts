import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  notifyApplicationAccepted,
  notifyApplicationRejected,
} from "@/lib/email";

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
  bufferDays: number = 1,
): boolean {
  const bufferedStart1 = addDays(start1, -bufferDays);
  const bufferedEnd1 = addDays(end1, bufferDays);
  const bufferedStart2 = addDays(start2, -bufferDays);
  const bufferedEnd2 = addDays(end2, bufferDays);

  return bufferedStart1 <= bufferedEnd2 && bufferedStart2 <= bufferedEnd1;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  console.log("🚀 APPLICATION STATUS UPDATE API CALLED"); // ✅ ADD THIS

  try {
    const { id: applicationId } = await context.params;
    const body = await request.json();

    console.log("📥 Request body:", body); // ✅ ADD THIS

    const { status } = body;

    console.log(
      "🔍 Updating application:",
      applicationId,
      "to status:",
      status,
    );

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 },
      );
    }

    // Get application details WITH job info
    console.log("📝 Fetching application with job details..."); // ✅ ADD THIS

    const { data: application, error: appError } = await supabaseAdmin
      .from("applications")
      .select(
        `
        *,
        jobs (
          id,
          title,
          company_name,
          event_start_date,
          event_end_date,
          event_start_time,
          event_end_time,
          location,
          payment,
          helpers_needed,
          archived
        )
      `,
      )
      .eq("id", applicationId)
      .single();

    if (appError || !application) {
      console.error("❌ Application not found:", appError);
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 },
      );
    }

    console.log("✅ Application found:", {
      id: application.id,
      name: application.name,
      seeker_id: application.seeker_id,
      job_id: application.job_id,
    });

    const job = application.jobs as any;

    // If accepting application, implement auto-withdraw logic
    if (status === "accepted") {
      console.log("📝 Processing acceptance...");

      // Get all OTHER applications by this seeker (pending status only)
      const { data: otherApplications, error: otherAppsError } =
        await supabaseAdmin
          .from("applications")
          .select("id, job_id")
          .eq("seeker_id", application.seeker_id)
          .eq("status", "pending")
          .neq("id", applicationId);

      if (otherAppsError) throw otherAppsError;

      if (otherApplications && otherApplications.length > 0) {
        const otherJobIds = otherApplications.map((app) => app.job_id);

        const { data: otherJobs, error: otherJobsError } = await supabaseAdmin
          .from("jobs")
          .select("id, event_start_date, event_end_date")
          .in("id", otherJobIds);

        if (otherJobsError) throw otherJobsError;

        // AUTO-WITHDRAW overlapping applications
        const applicationsToWithdraw: string[] = [];

        for (const otherApp of otherApplications) {
          const otherJob = otherJobs?.find((j) => j.id === otherApp.job_id);

          if (
            otherJob &&
            dateRangesOverlap(
              job.event_start_date,
              job.event_end_date,
              otherJob.event_start_date,
              otherJob.event_end_date,
              1,
            )
          ) {
            applicationsToWithdraw.push(otherApp.id);
          }
        }

        if (applicationsToWithdraw.length > 0) {
          const { error: deleteError } = await supabaseAdmin
            .from("applications")
            .delete()
            .in("id", applicationsToWithdraw);

          if (deleteError) {
            console.error("Error auto-withdrawing applications:", deleteError);
          } else {
            console.log(
              `✅ Auto-withdrew ${applicationsToWithdraw.length} conflicting applications`,
            );
          }
        }
      }

      // Check if job should be auto-archived
      if (!job.archived) {
        const { data: acceptedApps } = await supabaseAdmin
          .from("applications")
          .select("id")
          .eq("job_id", job.id)
          .eq("status", "accepted");

        const acceptedCount = (acceptedApps?.length || 0) + 1;

        if (acceptedCount >= job.helpers_needed) {
          await supabaseAdmin
            .from("jobs")
            .update({ archived: true })
            .eq("id", job.id);

          console.log(`✅ Job auto-archived (fully staffed)`);
        }
      }
    }

    // Update the application status
    console.log("📝 Updating application status in database..."); // ✅ ADD THIS

    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from("applications")
      .update({ status })
      .eq("id", applicationId)
      .select()
      .single();

    if (updateError) {
      console.error("❌ Error updating application:", updateError);
      throw updateError;
    }

    console.log("✅ Application status updated to:", status);

    // ✅ SEND EMAIL NOTIFICATIONS TO SEEKER
    console.log("📧 Starting email notification process..."); // ✅ ADD THIS

    try {
      console.log("📧 Preparing to send email notification...");
      console.log("📧 Application seeker_id:", application.seeker_id);

      // Get seeker email from users table
      console.log("📧 Querying users table for seeker email..."); // ✅ ADD THIS

      const { data: seeker, error: seekerError } = await supabaseAdmin
        .from("users")
        .select("email") // ✅ CORRECT - only select 'email'
        .eq("id", application.seeker_id)
        .single();

      if (seekerError) {
        console.error("❌ Error fetching seeker:", seekerError);
        console.error(
          "❌ Seeker error details:",
          JSON.stringify(seekerError, null, 2),
        );
      }

      if (!seeker) {
        console.error(
          "❌ Seeker not found in users table for id:",
          application.seeker_id,
        );
        console.log(
          "💡 This means the seeker_id in applications does not match any user",
        );
      } else if (!seeker.email) {
        console.error("❌ Seeker has no email:", seeker);
      } else {
        console.log("✅ Seeker email found:", seeker.email);

        if (status === "accepted") {
          console.log("📧 Sending acceptance email...");

          const dateRange =
            job.event_start_date === job.event_end_date
              ? job.event_start_date
              : `${job.event_start_date} to ${job.event_end_date}`;

          console.log("📧 Calling notifyApplicationAccepted function..."); // ✅ ADD THIS

          const emailResult = await notifyApplicationAccepted(
            seeker.email,
            application.name,
            job.title,
            job.company_name,
            dateRange,
            job.payment,
          );

          console.log("📧 Acceptance email result:", emailResult);

          if (emailResult.success) {
            console.log("✅ Acceptance email sent to:", seeker.email);
          } else {
            console.error("❌ Acceptance email failed:", emailResult.error);
          }
        } else if (status === "rejected") {
          console.log("📧 Sending rejection email...");

          console.log("📧 Calling notifyApplicationRejected function..."); // ✅ ADD THIS

          const emailResult = await notifyApplicationRejected(
            seeker.email,
            application.name,
            job.title,
          );

          console.log("📧 Rejection email result:", emailResult);

          if (emailResult.success) {
            console.log("✅ Rejection email sent to:", seeker.email);
          } else {
            console.error("❌ Rejection email failed:", emailResult.error);
          }
        }
      }
    } catch (emailError) {
      console.error("❌ Email notification error:", emailError);
      console.error("❌ Email error stack:", (emailError as Error).stack); // ✅ ADD THIS
      // Don't fail the request if email fails
    }

    console.log("✅ Application status update API completed successfully"); // ✅ ADD THIS

    return NextResponse.json({
      success: true,
      application: updatedApp,
    });
  } catch (error: any) {
    console.error("❌ Error updating application:", error);
    console.error("❌ Error stack:", error.stack); // ✅ ADD THIS
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: applicationId } = await context.params;

    const { error } = await supabaseAdmin
      .from("applications")
      .delete()
      .eq("id", applicationId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
