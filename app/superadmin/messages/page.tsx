"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import LogoutButton from "@/components/navbar/LogoutButton";

type Message = {
  id: string;
  company_id: string;
  company_name: string;
  sender_type: "company" | "superadmin";
  message: string;
  read: boolean;
  created_at: string;
};

export default function SuperAdminMessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      markAsRead(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "superadmin") {
      router.push("/auth/login");
      return;
    }

    await loadConversations();
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const data = await apiCall("/direct-messages?userType=superadmin", {
        method: "GET",
      });

      if (data.success) {
        setConversations(data.conversations || {});
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (companyId: string) => {
    try {
      await apiCall("/direct-messages", {
        method: "PATCH",
        body: JSON.stringify({ companyId, userType: "superadmin" }),
      });
      // Reload to update unread counts
      await loadConversations();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !selectedCompanyId) return;

    const selectedMessages = conversations[selectedCompanyId];
    const companyName = selectedMessages[0]?.company_name || "Unknown";

    setSending(true);
    try {
      const data = await apiCall("/direct-messages", {
        method: "POST",
        body: JSON.stringify({
          companyId: selectedCompanyId,
          companyName,
          senderType: "superadmin",
          message: newMessage,
        }),
      });

      if (data.success) {
        // Update local state
        setConversations({
          ...conversations,
          [selectedCompanyId]: [...selectedMessages, data.message],
        });
        setNewMessage("");
      }
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getUnreadCount = (companyId: string) => {
    return (conversations[companyId] || []).filter(
      (msg) => !msg.read && msg.sender_type === "company"
    ).length;
  };

  const selectedMessages = selectedCompanyId
    ? conversations[selectedCompanyId] || []
    : [];

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

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <button
              onClick={() => router.push("/superadmin/dashboard")}
              className="text-indigo-600 hover:text-purple-600 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              💬 Direct Messages
            </h1>
            <p className="text-gray-600 mt-2">
              All company conversations
            </p>
          </div>
          <LogoutButton />
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 grid grid-cols-1 md:grid-cols-3 h-[70vh]">
          {/* Conversations List */}
          <div className="border-r border-gray-200 overflow-y-auto bg-gray-50">
            <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
              Companies ({Object.keys(conversations).length})
            </div>
            {Object.keys(conversations).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No messages yet
              </div>
            ) : (
              Object.entries(conversations).map(([companyId, msgs]) => {
                const unread = getUnreadCount(companyId);
                const lastMessage = msgs[msgs.length - 1];
                return (
                  <div
                    key={companyId}
                    onClick={() => setSelectedCompanyId(companyId)}
                    className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-white transition-all ${
                      selectedCompanyId === companyId
                        ? "bg-white border-l-4 border-l-indigo-600"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800">
                          {msgs[0]?.company_name || "Unknown Company"}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {lastMessage?.message || "No messages"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(lastMessage?.created_at).toLocaleString()}
                        </p>
                      </div>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Chat Area */}
          <div className="col-span-2 flex flex-col">
            {!selectedCompanyId ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a company to view messages
              </div>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                  {selectedMessages.map((msg) => {
                    const isMe = msg.sender_type === "superadmin";
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl ${
                            isMe
                              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                              : "bg-white border-2 border-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-sm font-semibold mb-1">
                            {isMe ? "You" : msg.company_name}
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
                  })}
                </div>

                {/* Input */}
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
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}