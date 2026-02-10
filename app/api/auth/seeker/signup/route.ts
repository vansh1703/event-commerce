// app/api/auth/seeker/signup/route.ts

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone } = await request.json();

    // Check if exists
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password,
        user_type: 'seeker',
        full_name: name,
        phone,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}