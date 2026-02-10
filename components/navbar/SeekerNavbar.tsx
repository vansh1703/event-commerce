"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerLogoutButton from "./SeekerLogoutButton";

export default function SeekerNavbar() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);

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
        method: 'GET',
      });
      const data = await res.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
      <div className="flex-1">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Hello, {seekerUser?.full_name || "Job Seeker"}! 👋
        </h1>
        {stats && (
          <div className="flex gap-4 mt-2 text-sm flex-wrap">
            <span className="text-gray-600">
              ⭐ Rating:{" "}
              <span className="font-semibold">
                {stats.avgRating > 0 ? stats.avgRating : "No ratings yet"}
              </span>
            </span>
            <span
              className={`${
                stats.redFlagCount > 0 ? "text-red-600 font-semibold" : "text-gray-600"
              }`}
            >
              🚩 Red Flags: <span className="font-semibold">{stats.redFlagCount}</span>
            </span>
            {stats.isBanned && (
              <span className="text-red-600 font-bold">🚫 BANNED</span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2 md:gap-3 flex-wrap">
        <button
          onClick={() => router.push("/events")}
          className="bg-white text-indigo-600 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-sm md:text-base"
        >
          Browse Jobs
        </button>
        <button
          onClick={() => router.push("/my-applications")}
          className="bg-white text-purple-600 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-purple-600 hover:bg-purple-50 transition-all duration-300 font-semibold text-sm md:text-base"
        >
          My Applications
        </button>
        <button
          onClick={() => router.push("/completed-events")}
          className="bg-white text-green-600 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-green-600 hover:bg-green-50 transition-all duration-300 font-semibold text-sm md:text-base"
        >
          History
        </button>
        <SeekerLogoutButton />
      </div>
    </div>
  );
}