import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    console.log('Login attempt for:', email);

    // Check if SuperAdmin (hardcoded check)
    if (email === "admin@eventhire.com" && password === "SuperAdmin@2026") {
      return NextResponse.json({
        success: true,
        user: {
          id: 'superadmin',
          email: "admin@eventhire.com",
          user_type: "superadmin",
          company_name: "SuperAdmin",
        },
      });
    }

    // Regular company login
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('user_type', 'company')
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

    console.log('Login successful for:', email);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        company_name: user.company_name,
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}