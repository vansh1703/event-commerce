import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { finalTitle, finalPayment, finalDescription, postedBy, requestData } = await request.json();

    console.log('Approving request:', params.id);
    console.log('Request data:', requestData);

    // Create job
    const { data: job, error: jobError } = await supabaseAdmin
      .from('jobs')
      .insert({
        request_id: params.id,
        company_id: requestData.company_id,
        company_name: requestData.company_name,
        company_email: requestData.company_email,
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
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      throw jobError;
    }

    console.log('Job created:', job);

    // Update request status
    const { error: updateError } = await supabaseAdmin
      .from('job_requests')
      .update({
        status: 'approved',
        approved_job_id: job.id,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Update request error:', updateError);
      throw updateError;
    }

    console.log('Request updated to approved');

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}