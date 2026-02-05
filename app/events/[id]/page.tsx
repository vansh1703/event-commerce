"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id;

  const [job, setJob] = useState<any>(null);

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
  }, [jobId, router]);

  // Apply Submit
  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();

    const newApplication = {
      jobId,
      name,
      phone,
      age,
      city,
      experience,
      availability,
      appliedAt: new Date().toLocaleDateString(),
    };

    const oldApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    localStorage.setItem(
      "applications",
      JSON.stringify([...oldApplications, newApplication])
    );

    alert("Applied Successfully!");

    router.push("/events");
  };

  if (!job) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        {/* Job Info */}
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {job.title}
        </h1>

        <div className="space-y-2 mb-8">
          <p className="text-gray-600 flex items-center gap-2">
            <span className="text-indigo-600">📍</span>
            <span className="font-medium">Location:</span> {job.location}
          </p>

          <p className="text-gray-600 flex items-center gap-2">
            <span className="text-indigo-600">👥</span>
            <span className="font-medium">Helpers Needed:</span> {job.helpersNeeded}
          </p>

          <p className="text-gray-800 flex items-center gap-2 font-bold text-lg">
            <span className="text-indigo-600">💰</span>
            Payment: {job.payment}
          </p>
        </div>

        {/* Apply Form */}
        <div className="border-t border-indigo-100 pt-6">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800">
            Apply for this Job
          </h2>

          <form onSubmit={handleApply} className="space-y-4">
            <input
              placeholder="Full Name"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              placeholder="Phone Number"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Age"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={age}
              onChange={(e) => setAge(Number(e.target.value))}
              required
            />

            <input
              placeholder="City"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />

            <textarea
              placeholder="Experience (if any)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              required
            />

            <select
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              required
            >
              <option value="">Select Availability</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Only Weekends">Only Weekends</option>
            </select>

            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
              Submit Application
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}