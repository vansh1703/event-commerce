import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const applicationId = params.id;

    console.log('Canceling approval for application:', applicationId);

    // Update application status back to pending
    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ status: 'pending' })
      .eq('id', applicationId)
      .select()
      .single();

    if (error) {
      console.error('Cancel approval error:', error);
      throw error;
    }

    console.log('Approval canceled:', data);

    return NextResponse.json({ success: true, application: data });
  } catch (error: any) {
    console.error('Cancel approval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}