import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: Request) {
  try {
    const { data: jobs, error } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}