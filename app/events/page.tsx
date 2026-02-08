"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";

type Job = {
  id: string;
  title: string;
  eventType: string;
  location: string;
  helpersNeeded: number;
  payment: string;
  date: string;
  completed?: boolean;
};

export default function EventsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [seekerUser, setSeekerUser] = useState<any>(null);

  useEffect(() => {
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    
    // Filter out completed events
    const activeJobs = storedJobs.filter((job: Job) => {
      // Check if manually marked complete
      if (job.completed) return false;
      
      // Check if date has passed
      const eventDate = new Date(job.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return eventDate >= today;
    });
    
    setJobs(activeJobs);

    // Check if seeker is logged in
    const user = localStorage.getItem("seekerUser");
    if (user) {
      setSeekerUser(JSON.parse(user));
    }
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        {/* Show navbar if logged in, otherwise show login/signup buttons */}
        {seekerUser ? (
          <SeekerNavbar />
        ) : (
          <div className="flex justify-between items-center mb-10">
            {/* <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Available Event Jobs
            </h1> */}
            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => router.push("/seeker/login")}
                className="bg-white text-indigo-600 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-sm md:text-base"
              >
                Login
              </button>
              <button
                onClick={() => router.push("/seeker/signup")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {!seekerUser && (
          <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Available Event Jobs
          </h1>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 md:p-8 text-center border border-white/20">
            <p className="text-gray-500">No active event jobs available.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/events/${job.id}`}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-4 md:p-6 border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                  {job.title}
                </h2>

                <div className="space-y-2 text-sm md:text-base">
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">🎭</span>
                    <span className="font-medium">Type:</span> {job.eventType}
                  </p>

                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">📍</span>
                    <span className="font-medium">Location:</span> {job.location}
                  </p>

                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">📅</span>
                    <span className="font-medium">Date:</span> {job.date}
                  </p>

                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">👥</span>
                    <span className="font-medium">Helpers:</span> {job.helpersNeeded}
                  </p>

                  <p className="text-gray-800 font-bold text-base md:text-lg mt-4 flex items-center gap-2">
                    <span className="text-indigo-600">💰</span>
                    {job.payment}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}