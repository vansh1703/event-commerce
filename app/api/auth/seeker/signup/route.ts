import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, profilePhoto, idProofPhoto } = await request.json();

    console.log('Seeker signup:', { name, email, phone });
    console.log('Photos:', { profilePhoto, idProofPhoto });

    // Check if exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Account already exists' }, { status: 400 });
    }

    // Create user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password,
        user_type: 'seeker',
        full_name: name,
        phone,
        profile_photo: profilePhoto,
        id_proof_photo: idProofPhoto,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      throw error;
    }

    console.log('User created:', user);

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}