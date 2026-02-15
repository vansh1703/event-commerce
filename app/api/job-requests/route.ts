import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyJobRequestSubmitted } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedRequests = data.map((req: any) => ({
      id: req.id,
      company_id: req.company_id,
      company_name: req.company_name,
      title: req.title,
      event_type: req.event_type,
      location: req.location,
      helpers_needed: req.helpers_needed,
      event_start_date: req.event_start_date,
      event_end_date: req.event_end_date,
      event_start_time: req.event_start_time,
      event_end_time: req.event_end_time,
      payment_offered: req.payment_offered,
      description: req.description,
      contact_phone: req.contact_phone,
      status: req.status,
      rejection_reason: req.rejection_reason,
      approved_job_id: req.approved_job_id,
      submitted_at: req.submitted_at,
      custom_fields: req.custom_fields || {},
    }));

    return NextResponse.json({
      success: true,
      jobRequests: formattedRequests,
    });
  } catch (error: any) {
    console.error('Error fetching job requests:', error);
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
      companyId,
      companyName,
      title,
      eventType,
      location,
      helpersNeeded,
      startDate,
      endDate,
      startTime,
      endTime,
      paymentOffered,
      description,
      contactPhone,
      customFields,
    } = body;

    // Validate required fields
    if (!companyId || !title || !eventType || !location || !helpersNeeded || 
        !startDate || !endDate || !startTime || !endTime || 
        !paymentOffered || !description || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      return NextResponse.json(
        { success: false, error: 'End date cannot be before start date' },
        { status: 400 }
      );
    }

    // Get company email
    const { data: companyData, error: companyError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    const submittedAt = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    // Insert job request WITH date ranges
    const { data, error } = await supabaseAdmin
      .from('job_requests')
      .insert({
        company_id: companyId,
        company_name: companyName,
        title,
        event_type: eventType,
        location,
        helpers_needed: helpersNeeded,
        event_start_date: startDate,
        event_end_date: endDate,
        event_start_time: startTime,
        event_end_time: endTime,
        payment_offered: paymentOffered,
        description,
        contact_phone: contactPhone,
        status: 'pending',
        submitted_at: submittedAt,
        custom_fields: customFields || {},
      })
      .select()
      .single();

    if (error) throw error;

    // ✅ SEND EMAIL NOTIFICATION TO SUPERADMIN
    try {
      const superAdminEmail = process.env.SUPERADMIN_EMAIL || 'newa1703@gmail.com';
      
      await notifyJobRequestSubmitted(
        superAdminEmail,
        companyName,
        title
      );
      
      console.log('✅ Email sent to SuperAdmin:', superAdminEmail);
    } catch (emailError) {
      console.error('❌ Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      jobRequest: data,
    });
  } catch (error: any) {
    console.error('Error creating job request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}