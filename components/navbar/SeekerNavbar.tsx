"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerLogoutButton from "./SeekerLogoutButton";

export default function SeekerNavbar() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const user = localStorage.getItem("seekerUser");
    if (!user) return;

    const parsedUser = JSON.parse(user);
    setSeekerUser(parsedUser);

    try {
      const res = await fetch(`/api/seekers/${parsedUser.id}/stats`, {
        method: "GET",
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        // Get profile photo from stats safely
        if (data.stats.seekerInfo?.profile_photo) {
          setProfilePhoto(data.stats.seekerInfo.profile_photo);
        }
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 p-4 bg-white/70 backdrop-blur-md rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Compact Profile Photo Container */}
        <div className="relative">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={seekerUser?.full_name || "Profile"}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-100 shadow-sm flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
              {getInitials(seekerUser?.full_name || "JS")}
            </div>
          )}
          
          {/* Optional: Small Green Dot for "Active" status */}
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
        </div>

        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Hello, {seekerUser?.full_name || "Job Seeker"}! 👋
          </h1>
          
          {stats && (
            <div className="flex gap-3 mt-1 text-xs md:text-sm flex-wrap items-center">
              <span className="flex items-center gap-1 text-gray-500">
                ⭐ <span className="font-semibold text-gray-700">
                  {stats.avgRating > 0 ? stats.avgRating : "No ratings"}
                </span>
              </span>
              
              <span className="text-gray-300">|</span>

              <span
                className={`flex items-center gap-1 ${
                  stats.redFlagCount > 0 ? "text-red-600 font-semibold" : "text-gray-500"
                }`}
              >
                🚩 <span>{stats.redFlagCount} Red Flags</span>
              </span>

              {stats.isBanned && (
                <span className="ml-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">
                  Banned
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2 md:gap-3 flex-wrap w-full md:w-auto">
        <button
          onClick={() => router.push("/events")}
          className="flex-1 md:flex-none bg-white text-indigo-600 px-4 py-2 rounded-xl border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-600 transition-all duration-200 font-semibold text-sm"
        >
          Browse Jobs
        </button>
        <button
          onClick={() => router.push("/my-applications")}
          className="flex-1 md:flex-none bg-white text-purple-600 px-4 py-2 rounded-xl border border-purple-200 hover:bg-purple-50 hover:border-purple-600 transition-all duration-200 font-semibold text-sm"
        >
          Applications
        </button>
        <button
          onClick={() => router.push("/completed-events")}
          className="flex-1 md:flex-none bg-white text-green-600 px-4 py-2 rounded-xl border border-green-200 hover:bg-green-50 hover:border-green-600 transition-all duration-200 font-semibold text-sm"
        >
          History
        </button>
        <SeekerLogoutButton />
      </div>
    </nav>
  );
}