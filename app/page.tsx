"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          EventHire
        </h1>
        <p className="text-xl md:text-2xl text-gray-600 mb-12">
          Connect event organizers with talented helpers
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Job Seekers */}
          <div
            onClick={() => router.push("/events")}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Find Event Jobs</h2>
            <p className="text-gray-600">
              Browse available event opportunities and apply instantly
            </p>
          </div>

          {/* Companies */}
          <div
            onClick={() => router.push("/auth/login")}
            className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Post Event Jobs</h2>
            <p className="text-gray-600">
              Find qualified helpers for your events quickly
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}