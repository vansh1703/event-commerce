import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { companyName, email, password, companyAddress, contactPerson, phone } = await request.json();

    console.log('Create company attempt:', { companyName, email, contactPerson });

    // Validate all fields
    if (!companyName || !email || !password || !companyAddress || !contactPerson || !phone) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      throw checkError;
    }

    if (existing) {
      return NextResponse.json({ error: 'This email is already registered' }, { status: 400 });
    }

    // Create company account
    const { data: company, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password,
        user_type: 'company',
        company_name: companyName,
        company_address: companyAddress,
        contact_person: contactPerson,
        phone,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('Company created:', company);

    return NextResponse.json({ success: true, company });
  } catch (error: any) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}