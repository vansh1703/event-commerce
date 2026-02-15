import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const { data: companies, error } = await supabaseAdmin
      .from('users')
      .select('id, email, company_name, company_address, contact_person, phone, user_type')
      .eq('user_type', 'company')
      .order('company_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      companies: companies || [],
    });
  } catch (error: any) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}