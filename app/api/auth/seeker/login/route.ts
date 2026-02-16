import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('Seeker login attempt for:', email);

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('user_type', 'seeker')
      .single();

    if (error || !user) {
      console.log('Login failed - user not found:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // ✅ SECURE: Compare hashed password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      console.log('Login failed - invalid password:', email);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('Seeker login successful for:', email);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        full_name: user.full_name,
        phone: user.phone,
      }
    });
  } catch (error: any) {
    console.error('Seeker login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}