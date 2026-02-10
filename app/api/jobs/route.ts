import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Auto-complete past events
    const now = new Date();
    for (const job of jobs || []) {
      if (job.completed) continue;

      const eventDateTime = new Date(`${job.date} ${job.time}`);
      if (eventDateTime < now) {
        await supabaseAdmin
          .from("jobs")
          .update({ completed: true })
          .eq("id", job.id);

        job.completed = true;
      }
    }

    return NextResponse.json({ success: true, jobs: jobs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
