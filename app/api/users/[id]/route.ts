import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;
    const body = await request.json();

    console.log('Updating user:', userId, 'with data:', body);

    const updateData: any = {};

    // Common fields
    if (body.email) updateData.email = body.email;
    if (body.password) updateData.password = body.password;
    if (body.phone) updateData.phone = body.phone;

    // Company-specific fields
    if (body.company_name) updateData.company_name = body.company_name;
    if (body.company_address !== undefined) updateData.company_address = body.company_address;
    if (body.contact_person) updateData.contact_person = body.contact_person;

    // Seeker-specific fields
    if (body.full_name) updateData.full_name = body.full_name;
    if (body.age) updateData.age = body.age;
    if (body.city) updateData.city = body.city;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    console.log('User updated successfully:', data);

    return NextResponse.json({
      success: true,
      user: data,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params;

    console.log('🗑️ Deleting user:', userId);

    // With CASCADE enabled, just delete the user!
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    console.log('✅ User and all related data deleted successfully');

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    console.error('❌ Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}