import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { archived } = await request.json();
    const params = await context.params; // ✅ AWAIT THIS!

    const { error } = await supabaseAdmin
      .from('jobs')
      .update({ archived })
      .eq('id', params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Archive error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}