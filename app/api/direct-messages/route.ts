import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const MESSAGES_FILE = path.join(process.cwd(), "data", "direct-messages.json");
const MESSAGE_RETENTION_DAYS = 7;

// Ensure data directory exists
const ensureDataDir = () => {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
  }
};

const readMessages = () => {
  ensureDataDir();
  const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
  return JSON.parse(data);
};

const writeMessages = (messages: any[]) => {
  ensureDataDir();
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
};

// 🗑️ DELETE MESSAGES OLDER THAN 7 DAYS
const cleanupOldMessages = (messages: any[]) => {
  const now = new Date();
  const retentionMs = MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000;

  return messages.filter((msg: any) => {
    const messageDate = new Date(msg.created_at);
    const age = now.getTime() - messageDate.getTime();
    return age < retentionMs;
  });
};

// GET messages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const userType = searchParams.get("userType");

    let allMessages = readMessages();

    // 🗑️ AUTO-CLEANUP OLD MESSAGES
    const cleanedMessages = cleanupOldMessages(allMessages);
    
    // Save cleaned messages if any were deleted
    if (cleanedMessages.length !== allMessages.length) {
      writeMessages(cleanedMessages);
      console.log(`🗑️ Deleted ${allMessages.length - cleanedMessages.length} messages older than ${MESSAGE_RETENTION_DAYS} days`);
    }

    allMessages = cleanedMessages;

    if (userType === "superadmin") {
      // Group by company
      const groupedMessages: Record<string, any[]> = {};
      allMessages.forEach((msg: any) => {
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
      // Company messages
      const messages = allMessages.filter(
        (msg: any) => msg.company_id === companyId
      );

      return NextResponse.json({
        success: true,
        messages: messages,
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

    let allMessages = readMessages();

    // 🗑️ AUTO-CLEANUP OLD MESSAGES BEFORE ADDING NEW ONE
    allMessages = cleanupOldMessages(allMessages);

    const newMessage = {
      id: uuidv4(),
      company_id: companyId,
      company_name: companyName,
      sender_type: senderType,
      message: message.trim(),
      read: false,
      created_at: new Date().toISOString(),
    };

    allMessages.push(newMessage);
    writeMessages(allMessages);

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error: any) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH mark messages as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, userType } = body;

    let allMessages = readMessages();

    // 🗑️ AUTO-CLEANUP OLD MESSAGES
    allMessages = cleanupOldMessages(allMessages);

    const updatedMessages = allMessages.map((msg: any) => {
      if (msg.company_id === companyId && !msg.read) {
        if (
          (userType === "company" && msg.sender_type === "superadmin") ||
          (userType === "superadmin" && msg.sender_type === "company")
        ) {
          return { ...msg, read: true };
        }
      }
      return msg;
    });

    writeMessages(updatedMessages);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}