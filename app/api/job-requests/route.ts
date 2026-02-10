// app/api/job-requests/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - Create job request
export async function POST(request: Request) {
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
    } = body;

    const { data, error } = await supabase
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
        submitted_at: new Date().toLocaleDateString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, jobRequest: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - Get all job requests
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('job_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, jobRequests: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}