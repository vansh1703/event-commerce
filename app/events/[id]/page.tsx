"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Applicant Fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState<number>(18);
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");

  // Load Job Data
  useEffect(() => {
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const foundJob = storedJobs.find((j: any) => j.id === jobId);

    if (!foundJob) {
      alert("Job not found!");
      router.push("/events");
      return;
    }

    setJob(foundJob);

    // Check if seeker is logged in
    const user = localStorage.getItem("seekerUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setSeekerUser(parsedUser);
      setName(parsedUser.name);
      setPhone(parsedUser.phone);

      // Check if already applied
      const applications = JSON.parse(
        localStorage.getItem("applications") || "[]"
      );
      const hasApplied = applications.some(
        (app: any) => app.jobId === jobId && app.name === parsedUser.name
      );
      setAlreadyApplied(hasApplied);
    }
  }, [jobId, router]);

  // Apply Submit
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    if (!seekerUser) {
      const confirmLogin = window.confirm(
        "Please login to apply for this job. Click OK to go to login page."
      );
      if (confirmLogin) {
        router.push("/seeker/login");
      }
      return;
    }

    if (alreadyApplied) {
      alert("You have already applied for this job!");
      return;
    }

    const newApplication = {
      jobId,
      name,
      phone,
      age,
      city,
      experience,
      availability,
      appliedAt: new Date().toLocaleDateString(),
      status: "pending",
    };

    const oldApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    localStorage.setItem(
      "applications",
      JSON.stringify([...oldApplications, newApplication])
    );

    alert("Applied Successfully!");
    router.push("/my-applications");
  };

  if (!job) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        {seekerUser && <SeekerNavbar />}

        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 border border-gray-100">
          {/* Job Info */}
          <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {job.title}
          </h1>

          <div className="space-y-2 mb-8 text-sm md:text-base">
            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-indigo-600">📍</span>
              <span className="font-medium">Location:</span> {job.location}
            </p>

            <p className="text-gray-600 flex items-center gap-2">
              <span className="text-indigo-600">👥</span>
              <span className="font-medium">Helpers Needed:</span>{" "}
              {job.helpersNeeded}
            </p>

            <p className="text-gray-800 flex items-center gap-2 font-bold text-base md:text-lg">
              <span className="text-indigo-600">💰</span>
              Payment: {job.payment}
            </p>
          </div>

          {/* Already Applied Message */}
          {alreadyApplied && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-4 md:p-6 mb-6">
              <p className="text-green-700 text-center font-semibold flex items-center justify-center gap-2 text-sm md:text-base">
                <span className="text-xl md:text-2xl">✓</span>
                You have already applied for this job!
              </p>
              <button
                onClick={() => router.push("/my-applications")}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-semibold text-sm md:text-base"
              >
                View My Applications
              </button>
            </div>
          )}

          {/* Login Prompt for Guest Users */}
          {!seekerUser && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-4 md:p-6 mb-6">
              <p className="text-gray-700 text-center font-medium text-sm md:text-base">
                📝 Please login to apply for this job
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <button
                  onClick={() => router.push("/seeker/login")}
                  className="bg-white text-indigo-600 px-4 md:px-6 py-2 rounded-xl border-2 border-indigo-600 hover:bg-indigo-50 transition-all font-semibold text-sm md:text-base"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/seeker/signup")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold text-sm md:text-base"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {/* Apply Form */}
          {!alreadyApplied && (
            <div className="border-t border-indigo-100 pt-6">
              <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800">
                Apply for this Job
              </h2>

              <form onSubmit={handleApply} className="space-y-4">
                <input
                  placeholder="Full Name"
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800 text-sm md:text-base"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!!seekerUser}
                  required
                />

                <input
                  placeholder="Phone Number"
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800 text-sm md:text-base"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!!seekerUser}
                  required
                />

                <input
                  type="number"
                  placeholder="Age"
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800 text-sm md:text-base"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  required
                />

                <input
                  placeholder="City"
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800 text-sm md:text-base"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />

                <textarea
                  placeholder="Experience (if any)"
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl min-h-[100px] md:min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800 text-sm md:text-base"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                />

                <select
                  className="w-full border-2 border-gray-200 p-3 md:p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800 text-sm md:text-base"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  required
                >
                  <option value="">Select Availability</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Only Weekends">Only Weekends</option>
                </select>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 md:py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm md:text-base"
                >
                  {seekerUser ? "Submit Application" : "Login to Apply"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}