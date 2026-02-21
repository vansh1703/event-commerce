import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// GET checklist for a job
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const { data: checklist, error } = await supabaseAdmin
      .from("event_checklists")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      checklist: checklist || null,
    });
  } catch (error: any) {
    console.error("Error fetching checklist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST/UPDATE checklist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, companyId, checklistItems } = body;

    if (!jobId || !companyId || !checklistItems) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if checklist exists
    const { data: existing } = await supabaseAdmin
      .from("event_checklists")
      .select("*")
      .eq("job_id", jobId)
      .maybeSingle();

    let result;

    if (existing) {
      // Update existing checklist
      const { data, error } = await supabaseAdmin
        .from("event_checklists")
        .update({
          checklist_items: checklistItems,
          updated_at: new Date().toISOString(),
        })
        .eq("job_id", jobId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new checklist
      const { data, error } = await supabaseAdmin
        .from("event_checklists")
        .insert({
          job_id: jobId,
          company_id: companyId,
          checklist_items: checklistItems,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      checklist: result,
    });
  } catch (error: any) {
    console.error("Error saving checklist:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}