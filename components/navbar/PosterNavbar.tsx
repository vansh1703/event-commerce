"use client";

import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default function PosterNavbar() {
  return (
    <nav className="w-full bg-white/80 backdrop-blur-xl shadow-lg px-6 py-4 rounded-3xl mb-8 border border-white/20">
      <div className="max-w-5xl mx-auto flex justify-between items-center">
        
        {/* Left Links */}
        <div className="flex gap-6 font-semibold">
          <Link 
            href="/dashboard" 
            className="text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300"
          >
            Dashboard
          </Link>

          <Link 
            href="/post" 
            className="text-gray-700 hover:text-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300"
          >
            Post Job
          </Link>
        </div>

        {/* Right Logout */}
        <LogoutButton/>
      </div>
    </nav>
  );
}