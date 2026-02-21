"use client";

import { useState, useEffect, useRef } from "react";
import { apiCall } from "@/lib/api";

type Message = {
  id: string;
  company_id: string;
  company_name: string;
  sender_type: "company" | "superadmin";
  message: string;
  read: boolean;
  created_at: string;
};

type Props = {
  companyId: string;
  companyName: string;
  userType: "company" | "superadmin";
};

export default function DirectMessageButton({ companyId, companyName, userType }: Props) {
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showModal) {
      loadMessages();
      markAsRead();
    }
    // Poll for new messages every 10 seconds when modal is open
    const interval = showModal
      ? setInterval(() => loadMessages(), 10000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showModal]);

  useEffect(() => {
    // Load unread count on mount
    loadUnreadCount();
    // Poll for unread count every 30 seconds
    const interval = setInterval(() => loadUnreadCount(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await apiCall(
        `/direct-messages?companyId=${companyId}&userType=${userType}`,
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

  const loadUnreadCount = async () => {
    try {
      const data = await apiCall(
        `/direct-messages?companyId=${companyId}&userType=${userType}`,
        { method: "GET" }
      );

      if (data.success) {
        const unread = (data.messages || []).filter(
          (msg: Message) =>
            !msg.read &&
            msg.sender_type !== userType
        ).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  const markAsRead = async () => {
    try {
      await apiCall("/direct-messages", {
        method: "PATCH",
        body: JSON.stringify({ companyId, userType }),
      });
      setUnreadCount(0);
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
          companyId,
          companyName,
          senderType: userType,
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

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:from-indigo-700 hover:to-purple-700 transition-all hover:scale-110 z-40"
      >
        <div className="relative">
          <span className="text-2xl">💬</span>
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Message Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-3xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">💬 Direct Messages</h2>
                <p className="text-sm opacity-90">
                  {userType === "company"
                    ? "Chat with SuperAdmin"
                    : `Chat with ${companyName}`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-all"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {loading && messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_type === userType;
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
            <form onSubmit={sendMessage} className="p-6 bg-white border-t-2 border-gray-100 rounded-b-3xl">
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
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}