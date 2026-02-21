import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MESSAGE_RETENTION_DAYS = 7;

// 🗑️ DELETE MESSAGES OLDER THAN 7 DAYS
const cleanupOldMessages = async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - MESSAGE_RETENTION_DAYS);

    const { error } = await supabase
      .from("direct_messages")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      console.error("Error cleaning up old messages:", error);
    }
  } catch (error) {
    console.error("Cleanup error:", error);
  }
};

// GET messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const userType = searchParams.get("userType");

    // Auto-cleanup old messages
    await cleanupOldMessages();

    if (userType === "superadmin") {
      // SuperAdmin: Get all conversations
      const { data: messages, error } = await supabase
        .from("direct_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by company
      const groupedMessages: Record<string, any[]> = {};
      messages?.forEach((msg) => {
        if (!groupedMessages[msg.company_id]) {
          groupedMessages[msg.company_id] = [];
        }
        groupedMessages[msg.company_id].push(msg);
      });

      return NextResponse.json({
        success: true,
        conversations: groupedMessages,
      });
    } else {
      // Company: Get their messages
      if (!companyId) {
        return NextResponse.json(
          { error: "Company ID is required" },
          { status: 400 }
        );
      }

      const { data: messages, error } = await supabase
        .from("direct_messages")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return NextResponse.json({
        success: true,
        messages: messages || [],
      });
    }
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, companyName, senderType, message } = body;

    if (!companyId || !companyName || !senderType || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        company_id: companyId,
        company_name: companyName,
        sender_type: senderType,
        message: message.trim(),
        read: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: data,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH mark as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userType } = body;

    let query = supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("company_id", companyId)
      .eq("read", false);

    if (userType === "company") {
      query = query.eq("sender_type", "superadmin");
    } else if (userType === "superadmin") {
      query = query.eq("sender_type", "company");
    }

    const { error } = await query;
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}