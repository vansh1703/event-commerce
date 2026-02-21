"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import CompanySidebar from "@/components/CompanySidebar";

type Message = {
  id: string;
  company_id: string;
  company_name: string;
  sender_type: "company" | "superadmin";
  message: string;
  read: boolean;
  created_at: string;
};

export default function CompanyMessagesPage() {
  const router = useRouter();
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (companyUser) {
      loadMessages();
      markAsRead();
      // Poll every 10 seconds
      const interval = setInterval(() => loadMessages(), 10000);
      return () => clearInterval(interval);
    }
  }, [companyUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "company") {
      router.push("/auth/login");
      return;
    }

    setCompanyUser(parsedUser);
  };

  const loadMessages = async () => {
    if (!companyUser) return;

    try {
      const data = await apiCall(
        `/direct-messages?companyId=${companyUser.id}&userType=company`,
        { method: "GET" }
      );

      if (data.success) {
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async () => {
    if (!companyUser) return;

    try {
      await apiCall("/direct-messages", {
        method: "PATCH",
        body: JSON.stringify({ companyId: companyUser.id, userType: "company" }),
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const data = await apiCall("/direct-messages", {
        method: "POST",
        body: JSON.stringify({
          companyId: companyUser.id,
          companyName: companyUser.company_name,
          senderType: "company",
          message: newMessage,
        }),
      });

      if (data.success) {
        setMessages([...messages, data.message]);
        setNewMessage("");
      }
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (!companyUser) return null;

  return (
    <>
    <CompanySidebar
        companyName={companyUser.company_name}
        companyId={companyUser.id}
      />
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">💬 Messages</h1>
            <p className="text-gray-600 mt-2">Chat with SuperAdmin</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            {/* Messages Area */}
            <div className="h-[60vh] overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_type === "company";
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl ${
                          isMe
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                            : "bg-white border-2 border-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm font-semibold mb-1">
                          {isMe ? "You" : "SuperAdmin"}
                        </p>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {msg.message}
                        </p>
                        <p
                          className={`text-xs mt-1 ${
                            isMe ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-6 bg-white border-t-2 border-gray-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border-2 border-gray-200 p-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}