import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Get all columns that actually exist in the users table for seekers
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('user_type', 'seeker')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Found seekers:', users?.length || 0);
    console.log('Sample user:', users?.[0]); // Log to see what fields exist

    return NextResponse.json({
      success: true,
      users: users || [],
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}