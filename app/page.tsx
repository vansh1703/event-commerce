"use client";

import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  const handlePostEvent = () => {
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
    } else {
      router.push("/post");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            EventHire
          </h1>
          <p className="text-gray-600 text-lg">
            Connect event organizers with talented helpers
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1 */}
          <div
            onClick={() => router.push("/events")}
            className="cursor-pointer bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              🔍
            </div>
            <h2 className="text-2xl font-bold mb-3 text-gray-800">
              Looking for an Event Job
            </h2>
            <p className="text-gray-600">
              Browse available jobs and apply instantly without signup.
            </p>
            <div className="mt-6 text-indigo-600 font-semibold flex items-center gap-2">
              Browse Jobs <span>→</span>
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={handlePostEvent}
            className="cursor-pointer bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
              
            </div> 
            <h2 className="text-2xl font-bold mb-3 text-gray-800">
              Want to Post an Event Job
            </h2>
            <p className="text-gray-600">
              Login as a poster and create jobs with your dashboard access.
            </p>
            <div className="mt-6 text-purple-600 font-semibold flex items-center gap-2">
              Post a Job <span>→</span>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}