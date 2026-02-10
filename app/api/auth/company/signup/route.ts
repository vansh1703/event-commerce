import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { companyName, email, password } = await request.json();

    // Use Supabase Auth to create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        user_type: 'company'
      }
    });

    if (authError) throw authError;

    // Also store in users table
    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id, // Use auth user ID
        email,
        password, // Or hash it first
        user_type: 'company',
        company_name: companyName,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}