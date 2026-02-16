import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { companyName, email, password } = await request.json();

    console.log('Signup attempt:', { companyName, email });

    // Check if exists
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
      return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
    }

    // ✅ SECURE: Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with hashed password
    const { data: user, error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password: hashedPassword, // ✅ Store hashed password
        user_type: 'company',
        company_name: companyName,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw insertError;
    }

    console.log('User created:', user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}