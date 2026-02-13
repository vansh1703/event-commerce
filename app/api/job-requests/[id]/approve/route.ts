import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: requestId } = await context.params;
    const body = await request.json();
    const { finalTitle, finalPayment, finalDescription, postedBy, requestData } = body;

    if (!finalTitle || !finalPayment) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the job request to access custom_fields
    const { data: jobRequest, error: fetchError } = await supabaseAdmin
      .from('job_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !jobRequest) {
      return NextResponse.json(
        { success: false, error: 'Job request not found' },
        { status: 404 }
      );
    }

    // ✅ Create job WITH custom fields from request
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        request_id: requestId,
        company_id: requestData.company_id,
        company_name: requestData.company_name,
        created_by: postedBy,
        title: finalTitle,
        event_type: requestData.event_type,
        location: requestData.location,
        helpers_needed: requestData.helpers_needed,
        date: requestData.event_date,
        time: requestData.event_time,
        payment: finalPayment,
        description: finalDescription,
        contact_phone: requestData.contact_phone,
        completed: false,
        archived: false,
        custom_fields: jobRequest.custom_fields || {}, // ✅ Pass custom fields to job
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Update job request status
    const { error: updateError } = await supabaseAdmin
      .from('job_requests')
      .update({
        status: 'approved',
        approved_job_id: job.id,
      })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('Error approving job request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}