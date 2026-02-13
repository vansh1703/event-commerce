import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
      event_date: req.event_date,
      event_time: req.event_time,
      payment_offered: req.payment_offered,
      description: req.description,
      contact_phone: req.contact_phone,
      status: req.status,
      rejection_reason: req.rejection_reason,
      approved_job_id: req.approved_job_id,
      submitted_at: req.submitted_at,
      custom_fields: req.custom_fields || {}, // ✅ Include custom fields
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
      date,
      time,
      paymentOffered,
      description,
      contactPhone,
      customFields, // ✅ Receive custom fields
    } = body;

    // Validate required fields
    if (!companyId || !title || !eventType || !location || !helpersNeeded || !date || !time || !paymentOffered || !description || !contactPhone) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // ✅ Insert job request WITH custom fields
    const { data, error } = await supabaseAdmin
      .from('job_requests')
      .insert({
        company_id: companyId,
        company_name: companyName,
        title,
        event_type: eventType,
        location,
        helpers_needed: helpersNeeded,
        event_date: date,
        event_time: time,
        payment_offered: paymentOffered,
        description,
        contact_phone: contactPhone,
        status: 'pending',
        submitted_at: submittedAt,
        custom_fields: customFields || {}, // ✅ Store custom fields
      })
      .select()
      .single();

    if (error) throw error;

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