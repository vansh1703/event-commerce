"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerLogoutButton from "./SeekerLogoutButton";

export default function SeekerNavbar() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [profilePhoto, setProfilePhoto] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    loadStatsFromCache();
  }, []);

  const loadStatsFromCache = async () => {
    const user = localStorage.getItem("seekerUser");
    if (!user) return;

    const parsedUser = JSON.parse(user);
    setSeekerUser(parsedUser);

    const cachedStats = localStorage.getItem(`seekerStats_${parsedUser.id}`);
    const cacheTimestamp = localStorage.getItem(`seekerStatsTime_${parsedUser.id}`);
    
    const CACHE_DURATION = 5 * 60 * 1000;
    const isCacheValid = cacheTimestamp && (Date.now() - parseInt(cacheTimestamp)) < CACHE_DURATION;

    if (cachedStats && isCacheValid) {
      const cached = JSON.parse(cachedStats);
      setStats(cached);
      if (cached.seekerInfo?.profile_photo) {
        setProfilePhoto(cached.seekerInfo.profile_photo);
      }
      setLoading(false);
      refreshStatsInBackground(parsedUser.id);
    } else {
      await fetchStats(parsedUser.id);
    }
  };

  const fetchStats = async (userId: string) => {
    try {
      const res = await fetch(`/api/seekers/${userId}/stats`, { method: "GET" });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        localStorage.setItem(`seekerStats_${userId}`, JSON.stringify(data.stats));
        localStorage.setItem(`seekerStatsTime_${userId}`, Date.now().toString());
        
        if (data.stats.seekerInfo?.profile_photo) {
          setProfilePhoto(data.stats.seekerInfo.profile_photo);
        }
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatsInBackground = async (userId: string) => {
    try {
      const res = await fetch(`/api/seekers/${userId}/stats`, { method: "GET" });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
        localStorage.setItem(`seekerStats_${userId}`, JSON.stringify(data.stats));
        localStorage.setItem(`seekerStatsTime_${userId}`, Date.now().toString());
        
        if (data.stats.seekerInfo?.profile_photo) {
          setProfilePhoto(data.stats.seekerInfo.profile_photo);
        }
      }
    } catch (error) {
      console.error("Background refresh failed:", error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleNavigation = (path: string) => {
    setMenuOpen(false);
    router.push(path);
  };

  if (loading) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="hidden md:block">
                <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <>
      {/* ✅ FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Profile Info */}
            <div className="flex items-center gap-3">
              <div className="relative">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt={seekerUser?.full_name || "Profile"}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-400 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {getInitials(seekerUser?.full_name || "JS")}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
              </div>

              {/* Desktop: Name + Stats */}
              <div className="hidden md:block">
                <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {seekerUser?.full_name || "Job Seeker"}
                </h1>
                {stats && (
                  <div className="flex gap-2 text-xs items-center">
                    <span className="text-gray-500 dark:text-gray-400">
                      ⭐ {stats.avgRating > 0 ? stats.avgRating : "N/A"}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">|</span>
                    <span className={stats.redFlagCount > 0 ? "text-red-600 font-semibold" : "text-gray-500 dark:text-gray-400"}>
                      🚩 {stats.redFlagCount}
                    </span>
                    {stats.isBanned && (
                      <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">BANNED</span>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile: Just name */}
              <div className="md:hidden">
                <h1 className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {seekerUser?.full_name?.split(' ')[0] || "Seeker"}
                </h1>
              </div>
            </div>

            {/* Right: Desktop Menu */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => router.push("/events")}
                className="bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900 transition-all font-semibold text-sm"
              >
                Browse Jobs
              </button>
              <button
                onClick={() => router.push("/my-applications")}
                className="bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900 transition-all font-semibold text-sm"
              >
                Applications
              </button>
              <button
                onClick={() => router.push("/completed-events")}
                className="bg-white dark:bg-gray-700 text-green-600 dark:text-green-400 px-4 py-2 rounded-xl border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900 transition-all font-semibold text-sm"
              >
                History
              </button>
              <SeekerLogoutButton />
            </div>

            {/* Right: Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5 bg-indigo-50 dark:bg-indigo-900 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all"
            >
              <span className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
              <span className={`w-5 h-0.5 bg-indigo-600 dark:bg-indigo-400 transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
            </button>
          </div>

          {/* Mobile Stats Bar */}
          {stats && (
            <div className="md:hidden mt-3 flex gap-3 text-xs border-t border-gray-200 dark:border-gray-700 pt-3">
              <span className="text-gray-500 dark:text-gray-400">⭐ {stats.avgRating > 0 ? stats.avgRating : "No ratings"}</span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className={stats.redFlagCount > 0 ? "text-red-600 font-semibold" : "text-gray-500 dark:text-gray-400"}>
                🚩 {stats.redFlagCount} Red Flags
              </span>
              {stats.isBanned && (
                <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full">BANNED</span>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ✅ MOBILE SLIDE-IN MENU */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 md:hidden ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      >
        <div
          className={`fixed right-0 top-0 h-full w-72 bg-white dark:bg-gray-800 shadow-2xl transition-transform duration-300 ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Menu Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-3 mb-2">
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={seekerUser?.full_name || "Profile"}
                  className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-lg"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-xl shadow-lg">
                  {getInitials(seekerUser?.full_name || "JS")}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg">{seekerUser?.full_name || "Job Seeker"}</h2>
                <p className="text-white/80 text-sm">{seekerUser?.email || ""}</p>
              </div>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 rounded-full text-white hover:bg-white/30 transition-all"
            >
              ✕
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-4 space-y-2">
            <button
              onClick={() => handleNavigation("/events")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-all font-semibold"
            >
              <span className="text-2xl">🔍</span>
              <span>Browse Jobs</span>
            </button>

            <button
              onClick={() => handleNavigation("/my-applications")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-800 transition-all font-semibold"
            >
              <span className="text-2xl">📋</span>
              <span>My Applications</span>
            </button>

            <button
              onClick={() => handleNavigation("/completed-events")}
              className="w-full flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800 transition-all font-semibold"
            >
              <span className="text-2xl">✅</span>
              <span>History</span>
            </button>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <SeekerLogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-20 md:h-24"></div>
    </>
  );
}