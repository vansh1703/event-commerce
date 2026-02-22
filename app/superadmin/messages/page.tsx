"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Auto-refresh messages every 5 seconds
    const interval = setInterval(() => {
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      markAsRead(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations[selectedCompanyId || ""]]);

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

    if (parsedUser.user_type !== "superadmin") {
      router.push("/auth/login");
      return;
    }

    await loadConversations();
  };

  const loadConversations = async () => {
    try {
      const data = await apiCall("/direct-messages?userType=superadmin", {
        method: "GET",
      });

      if (data.success) {
        const sortedConversations: Record<string, Message[]> = {};
        Object.entries(data.conversations || {}).forEach(([companyId, messages]) => {
          sortedConversations[companyId] = (messages as Message[]).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setConversations(sortedConversations);
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

  const getLastMessage = (companyId: string) => {
    const msgs = conversations[companyId] || [];
    return msgs[msgs.length - 1];
  };

  const sortedCompanyIds = Object.keys(conversations).sort((a, b) => {
    const lastMsgA = getLastMessage(a);
    const lastMsgB = getLastMessage(b);
    if (!lastMsgA || !lastMsgB) return 0;
    return new Date(lastMsgB.created_at).getTime() - new Date(lastMsgA.created_at).getTime();
  });

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
    <>
      <SuperAdminSidebar />
      
      {/* Main Content Area - PROPER SIDEBAR SPACING */}
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 lg:ml-64 pt-20 lg:pt-0">
        <div className="h-screen flex flex-col">
          
          {/* Header */}
          <div className="p-4 lg:p-6 flex-shrink-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">
              💬 Messages
            </h1>
            <p className="text-gray-600 mt-1 text-sm">
              Chat with companies
            </p>
          </div>

          {/* Messages Container */}
          <div className="flex-1 px-4 lg:px-6 pb-4 lg:pb-6 overflow-hidden">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 h-full flex">
              
              {/* Left Sidebar - Company List */}
              <div className={`${selectedCompanyId ? 'hidden lg:block' : 'block'} w-full lg:w-1/3 border-r border-gray-200 flex flex-col`}>
                
                {/* Header */}
                <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex-shrink-0 rounded-tl-3xl">
                  <h2 className="font-bold text-lg">Chats</h2>
                  <p className="text-xs opacity-90">{Object.keys(conversations).length} conversations</p>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto">
                  {sortedCompanyIds.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    sortedCompanyIds.map((companyId) => {
                      const msgs = conversations[companyId];
                      const unread = getUnreadCount(companyId);
                      const lastMessage = getLastMessage(companyId);
                      const isSelected = selectedCompanyId === companyId;

                      return (
                        <div
                          key={companyId}
                          onClick={() => setSelectedCompanyId(companyId)}
                          className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-all ${
                            isSelected ? "bg-indigo-50 border-l-4 border-l-indigo-600" : ""
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                              {msgs[0]?.company_name?.charAt(0).toUpperCase() || "?"}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-gray-800 truncate text-sm">
                                  {msgs[0]?.company_name || "Unknown Company"}
                                </h3>
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                  {lastMessage && new Date(lastMessage.created_at).toLocaleDateString() === new Date().toLocaleDateString()
                                    ? new Date(lastMessage.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                    : new Date(lastMessage?.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="text-sm text-gray-600 truncate">
                                  {lastMessage?.sender_type === "superadmin" && "You: "}
                                  {lastMessage?.message || "No messages"}
                                </p>
                                {unread > 0 && (
                                  <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-2">
                                    {unread}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Side - Chat Area */}
              <div className={`${!selectedCompanyId ? 'hidden lg:flex' : 'flex'} flex-1 flex-col`}>
                {!selectedCompanyId ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-tr-3xl">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-lg font-semibold">Select a chat to start messaging</p>
                    <p className="text-sm mt-2">Choose a company from the list</p>
                  </div>
                ) : (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center gap-3 flex-shrink-0 rounded-tr-3xl lg:rounded-tr-none">
                      <button
                        onClick={() => setSelectedCompanyId(null)}
                        className="lg:hidden text-white hover:bg-white/20 rounded-full p-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>

                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold">
                        {selectedMessages[0]?.company_name?.charAt(0).toUpperCase() || "?"}
                      </div>

                      <div>
                        <h3 className="font-bold text-lg">
                          {selectedMessages[0]?.company_name || "Unknown Company"}
                        </h3>
                        <p className="text-xs opacity-90">
                          {selectedMessages.length} messages
                        </p>
                      </div>
                    </div>

                    {/* Messages Area - SCROLLABLE */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {selectedMessages.map((msg) => {
                        const isMe = msg.sender_type === "superadmin";
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[75%] lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                isMe
                                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-none"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.message}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isMe ? "text-white/70 text-right" : "text-gray-500"
                                }`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form 
                      onSubmit={sendMessage} 
                      className="p-4 bg-white border-t border-gray-200 flex-shrink-0"
                    >
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          className="flex-1 border-2 border-gray-200 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm text-gray-800"
                          disabled={sending}
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-full hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center w-12 h-12 flex-shrink-0"
                        >
                          {sending ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}