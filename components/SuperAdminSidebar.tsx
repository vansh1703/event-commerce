"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./navbar/LogoutButton";

export default function SuperAdminSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: "🏠", label: "Dashboard", path: "/superadmin/dashboard" },
    { icon: "💬", label: "Messages", path: "/superadmin/messages" },
    { icon: "📋", label: "All Requests", path: "/superadmin/all-requests" },
    { icon: "➕", label: "Create Company", path: "/superadmin/create-company" },
    { icon: "🏢", label: "Edit Companies", path: "/superadmin/edit-companies", protected: true },
    { icon: "👤", label: "Edit Users", path: "/superadmin/edit-users", protected: true },
  ];

  const isActive = (path: string) => pathname === path;

  const handleProtectedRoute = (path: string) => {
    const password = prompt("Enter SuperAdmin password:");
    if (password === "123456") {
      router.push(path);
      setIsMobileMenuOpen(false);
    } else if (password !== null) {
      alert("❌ Incorrect password!");
    }
  };

  return (
    <>
      {/* Mobile Header - DARK THEME */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-gray-700 z-50 px-4 py-3 shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-1">
              <span>👑</span> SuperAdmin
            </h1>
            <p className="text-xs text-gray-400">Platform Control</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu - DARK THEME */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-gray-900 border-b border-gray-700 shadow-2xl">
            <div className="py-2">
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    if (item.protected) {
                      handleProtectedRoute(item.path);
                    } else {
                      router.push(item.path);
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`w-full px-4 py-3 flex items-center gap-3 transition-all ${
                    isActive(item.path)
                      ? "bg-indigo-600 text-white border-l-4 border-indigo-400"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.protected && <span className="text-xs text-red-400">🔒</span>}
                </button>
              ))}
              <div className="px-4 py-3 border-t border-gray-700">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar - DARK THEME & RETRACTABLE */}
      <aside className={`hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-r border-gray-700 z-40 transition-all duration-300 shadow-2xl ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          {!isCollapsed ? (
            <>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <span>👑</span> SuperAdmin
              </h1>
              <p className="text-sm text-gray-400 mt-1">Platform Control</p>
            </>
          ) : (
            <div className="text-2xl text-center">👑</div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-3 hover:bg-gray-700 border-b border-gray-700 transition-all text-gray-300"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <svg
            className={`w-5 h-5 mx-auto transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                if (item.protected) {
                  handleProtectedRoute(item.path);
                } else {
                  router.push(item.path);
                }
              }}
              className={`w-full px-6 py-3 flex items-center gap-3 transition-all ${
                isActive(item.path)
                  ? "bg-indigo-600 text-white border-l-4 border-indigo-400 shadow-lg"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.protected && <span className="text-xs text-red-400">🔒</span>}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        {/* <div className="p-6 border-t border-gray-700">
          <LogoutButton />
        </div> */}
      </aside>

      {/* Spacer for content - PREVENTS OVERLAP */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`} />
    </>
  );
}