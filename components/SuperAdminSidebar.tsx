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
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">👑 SuperAdmin</h1>
            <p className="text-xs text-gray-600">Platform Control</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
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
                      ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                  {item.protected && <span className="text-xs text-red-500">🔒</span>}
                </button>
              ))}
              <div className="px-4 py-3 border-t border-gray-200">
                <LogoutButton />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Sidebar - RETRACTABLE */}
      <aside className={`hidden lg:flex lg:flex-col fixed left-0 top-0 bottom-0 bg-white border-r border-gray-200 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          {!isCollapsed ? (
            <>
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
                <span>👑</span> SuperAdmin
              </h1>
              <p className="text-sm text-gray-600 mt-1">Platform Control</p>
            </>
          ) : (
            <div className="text-2xl text-center">👑</div>
          )}
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-3 hover:bg-gray-100 border-b border-gray-200 transition-all"
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
                  ? "bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
              title={isCollapsed ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <>
                  <span className="font-medium">{item.label}</span>
                  {item.protected && <span className="text-xs text-red-500">🔒</span>}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-6 border-t border-gray-200">
          <LogoutButton />
        </div>
      </aside>

      {/* Spacer for content - PREVENTS OVERLAP */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`} />
    </>
  );
}