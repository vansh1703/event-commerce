// app/api/job-requests/[id]/approve/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { finalTitle, finalPayment, finalDescription, postedBy, requestData } = await request.json();

    // Create job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        request_id: params.id,
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
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Update request status
    const { error: updateError } = await supabase
      .from('job_requests')
      .update({
        status: 'approved',
        approved_job_id: job.id,
      })
      .eq('id', params.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}