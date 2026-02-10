import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Check if SuperAdmin
    if (email === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD) {
      return NextResponse.json({
        success: true,
        user: {
          id: "superadmin",
          email: SUPERADMIN_EMAIL,
          user_type: "superadmin",
          company_name: "SuperAdmin",
        },
      });
    }

    // Check regular company
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("password", password)
      .eq("user_type", "company")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}