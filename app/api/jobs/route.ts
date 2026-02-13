import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedJobs = data.map((job: any) => ({
      id: job.id,
      request_id: job.request_id,
      company_id: job.company_id,
      company_name: job.company_name,
      created_by: job.created_by,
      title: job.title,
      event_type: job.event_type,
      location: job.location,
      helpers_needed: job.helpers_needed,
      date: job.date,
      time: job.time,
      payment: job.payment,
      description: job.description,
      contact_phone: job.contact_phone,
      completed: job.completed,
      archived: job.archived,
      created_at: job.created_at,
      custom_fields: job.custom_fields || {}, // ✅ Include custom fields
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}