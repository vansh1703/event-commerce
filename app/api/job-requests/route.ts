import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

    const { data: jobRequest, error } = await supabaseAdmin
      .from('job_requests')
      .insert({
        company_id: companyId,
        company_name: companyName,
        // Remove company_email - column doesn't exist!
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
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Insert error:', error);
      throw error;
    }

    console.log('✅ Job request created:', jobRequest);

    return NextResponse.json({ success: true, jobRequest });
  } catch (error: any) {
    console.error('💥 Job request error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { data: jobRequests, error } = await supabaseAdmin
      .from('job_requests')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, jobRequests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}