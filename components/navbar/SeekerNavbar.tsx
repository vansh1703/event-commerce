"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SeekerLogoutButton from "./SeekerLogoutButton";
import { useEffect, useState } from "react";

type Rating = {
  stars: number;
  jobTitle: string;
  date: string;
};

type RedFlag = {
  date: string;
  reason: string;
  jobTitle: string;
};

type SeekerProfile = {
  name: string;
  email: string;
  password: string;
  phone: string;
  redFlags: RedFlag[];
  ratings: Rating[];
  bannedUntil: string | null;
};

export default function SeekerNavbar() {
  const pathname = usePathname();
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [avgRating, setAvgRating] = useState<string>("0");
  const [redFlagCount, setRedFlagCount] = useState(0);

  useEffect(() => {
    const user = localStorage.getItem("seekerUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setSeekerUser(parsedUser);

      // Get stats from seeker accounts
      const seekerAccounts: SeekerProfile[] = JSON.parse(
        localStorage.getItem("seekerAccounts") || "[]"
      );

      const profile = seekerAccounts.find((acc) => acc.name === parsedUser.name);

      if (profile) {
        const ratings = profile.ratings || [];
        const avg =
          ratings.length > 0
            ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
            : 0;
        setAvgRating(avg > 0 ? avg.toFixed(1) : "0");
        setRedFlagCount(profile.redFlags?.length || 0);
      }
    }
  }, []);

  if (!seekerUser) return null;

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="w-full bg-white/90 backdrop-blur-xl shadow-lg px-4 md:px-6 py-4 rounded-3xl mb-8 border border-white/20 sticky top-4 z-50">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        {/* Left: Profile */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm md:text-base shadow-lg">
            {getInitials(seekerUser.name)}
          </div>
          {/* Name & Stats - Hidden on mobile */}
          <div className="hidden md:block">
            <p className="font-semibold text-gray-800">{seekerUser.name}</p>
            <div className="flex gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                ⭐ <span className="font-semibold">{avgRating}</span>
              </span>
              <span className={`flex items-center gap-1 ${redFlagCount > 0 ? 'text-red-600 font-semibold' : ''}`}>
                🚩 <span>{redFlagCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="flex gap-3 md:gap-6 font-semibold text-sm md:text-base">
          <Link
            href="/events"
            className={`${
              pathname === "/events"
                ? "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text"
                : "text-gray-700"
            } hover:text-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300`}
          >
            Browse Jobs
          </Link>

          <Link
            href="/my-applications"
            className={`${
              pathname === "/my-applications"
                ? "text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text"
                : "text-gray-700"
            } hover:text-transparent hover:bg-gradient-to-r hover:from-indigo-600 hover:to-purple-600 hover:bg-clip-text transition-all duration-300`}
          >
            My Applications
          </Link>
        </div>

        {/* Right: Logout */}
        <div className="hidden md:block">
          <SeekerLogoutButton />
        </div>

        {/* Mobile: Logout Icon */}
        <div className="md:hidden">
          <SeekerLogoutButton />
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className="md:hidden mt-3 pt-3 border-t border-gray-200 flex justify-center gap-6 text-sm">
        <span className="flex items-center gap-1">
          ⭐ <span className="font-semibold">{avgRating}</span> Rating
        </span>
        <span className={`flex items-center gap-1 ${redFlagCount > 0 ? 'text-red-600 font-semibold' : ''}`}>
          🚩 <span>{redFlagCount}</span> Flags
        </span>
      </div>
    </nav>
  );
}