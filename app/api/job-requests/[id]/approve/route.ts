import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyJobApproved } from '@/lib/email';

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

    console.log('🔍 Approving job request:', requestId);
    console.log('🔍 Request data:', requestData);

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
      console.error('❌ Job request not found:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Job request not found' },
        { status: 404 }
      );
    }

    console.log('✅ Job request found:', {
      id: jobRequest.id,
      company_id: jobRequest.company_id,
      title: jobRequest.title,
    });

    // Create job WITH date ranges and custom fields
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
        event_start_date: jobRequest.event_start_date,
        event_end_date: jobRequest.event_end_date,
        event_start_time: jobRequest.event_start_time,
        event_end_time: jobRequest.event_end_time,
        payment: finalPayment,
        description: finalDescription,
        contact_phone: requestData.contact_phone,
        completed: false,
        archived: false,
        custom_fields: jobRequest.custom_fields || {},
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Error creating job:', jobError);
      throw jobError;
    }

    console.log('✅ Job created successfully:', job.id);

    // Update job request status
    const { error: updateError } = await supabaseAdmin
      .from('job_requests')
      .update({
        status: 'approved',
        approved_job_id: job.id,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('❌ Error updating job request:', updateError);
      throw updateError;
    }

    console.log('✅ Job request status updated to approved');

    // ✅ SEND EMAIL NOTIFICATION TO COMPANY
    try {
      console.log('📧 Fetching company email for company_id:', jobRequest.company_id);

      // Get company email
      const { data: company, error: companyError } = await supabaseAdmin
        .from('users')
        .select('email, company_name')
        .eq('id', jobRequest.company_id)
        .single();

      console.log('📧 Company query result:', { company, error: companyError });

      if (companyError) {
        console.error('❌ Error fetching company:', companyError);
        throw companyError;
      }

      if (!company) {
        console.error('❌ Company not found for id:', jobRequest.company_id);
      } else if (!company.email) {
        console.error('❌ Company has no email:', company);
      } else {
        console.log('✅ Company found:', {
          email: company.email,
          company_name: company.company_name,
        });

        const dateRange = jobRequest.event_start_date === jobRequest.event_end_date
          ? jobRequest.event_start_date
          : `${jobRequest.event_start_date} to ${jobRequest.event_end_date}`;

        console.log('📧 Sending approval email to:', company.email);

        const emailResult = await notifyJobApproved(
          company.email,
          finalTitle,
          dateRange
        );

        console.log('📧 Email result:', emailResult);

        if (emailResult.success) {
          console.log('✅ Approval email sent successfully to:', company.email);
        } else {
          console.error('❌ Email failed to send:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('❌ Email notification error:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      job,
    });
  } catch (error: any) {
    console.error('❌ Error approving job request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
