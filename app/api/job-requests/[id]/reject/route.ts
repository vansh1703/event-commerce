// app/api/job-requests/[id]/reject/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { rejectionReason } = await request.json();

    const { error } = await supabase
      .from('job_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
      })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}