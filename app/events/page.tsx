"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  eventType: string;
  location: string;
  helpersNeeded: number;
  payment: string;
};

export default function EventsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    setJobs(storedJobs);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-10 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Available Event Jobs
        </h1>

        {jobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 text-center border border-white/20">
            <p className="text-gray-500">
              No event requirements posted yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/events/${job.id}`}
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
              >
                <h2 className="text-2xl font-semibold text-gray-800 mb-3">
                  {job.title}
                </h2>

                <div className="space-y-2">
                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">🎭</span>
                    <span className="font-medium">Type:</span> {job.eventType}
                  </p>

                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">📍</span>
                    <span className="font-medium">Location:</span> {job.location}
                  </p>

                  <p className="text-gray-600 flex items-center gap-2">
                    <span className="text-indigo-600">👥</span>
                    <span className="font-medium">Helpers:</span> {job.helpersNeeded}
                  </p>

                  <p className="text-gray-800 font-bold text-lg mt-4 flex items-center gap-2">
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