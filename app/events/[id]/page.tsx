"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  date: string;
  time: string;
  payment: string;
  description: string;
  contact_phone: string;
};

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    loadJob();
    checkUser();
  }, [jobId]);

  const checkUser = async () => {
    const user = localStorage.getItem("seekerUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setSeekerUser(parsedUser);
      setName(parsedUser.full_name || "");
      setPhone(parsedUser.phone || "");

      await checkIfApplied(parsedUser.id);
    }
  };

  const loadJob = async () => {
    try {
      const res = await fetch("/api/jobs", { method: "GET" });
      const data = await res.json();

      if (data.success) {
        const foundJob = data.jobs.find((j: Job) => j.id === jobId);
        if (foundJob) {
          // ✅ Check if archived
          if (foundJob.archived) {
            alert("This job is no longer accepting applications.");
            router.push("/events");
            return;
          }
          setJob(foundJob);
        } else {
          alert("Job not found!");
          router.push("/events");
        }
      }
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async (seekerId: string) => {
    try {
      const res = await fetch(
        `/api/applications?jobId=${jobId}&seekerId=${seekerId}`,
        {
          method: "GET",
        },
      );
      const data = await res.json();

      if (data.success && data.applications.length > 0) {
        setAlreadyApplied(true);
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seekerUser) {
      const confirmLogin = window.confirm(
        "Please login to apply for this job. Click OK to go to login page.",
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

    setApplying(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobId,
          seekerId: seekerUser.id,
          name,
          phone,
          age: parseInt(age),
          city,
          experience,
          availability,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      if (data.success) {
        alert("Application submitted successfully!");
        router.push("/my-applications");
      }
    } catch (error: any) {
      alert(error.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/events")}
          className="text-indigo-600 hover:text-purple-600 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Jobs
        </button>

        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {job.title}
          </h1>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Event Type</p>
                <p className="font-semibold text-gray-800">{job.event_type}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Location</p>
                <p className="font-semibold text-gray-800">{job.location}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                <p className="font-semibold text-gray-800">
                  {job.date} at {job.time}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Helpers Needed</p>
                <p className="font-semibold text-gray-800">
                  {job.helpers_needed}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Payment</p>
                <p className="font-semibold text-gray-800">{job.payment}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Contact</p>
                <p className="font-semibold text-gray-800">
                  {job.contact_phone}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-gray-500 mb-1">Description</p>
              <p className="text-gray-800">{job.description}</p>
            </div>
          </div>

          {alreadyApplied ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center">
              <p className="text-green-800 font-semibold text-lg mb-2">
                ✓ Already Applied
              </p>
              <p className="text-green-600">
                You have already applied for this job.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Apply for this Job
              </h2>

              <form onSubmit={handleApply} className="space-y-5">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!!seekerUser || applying}
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={!!seekerUser || applying}
                />

                <input
                  type="number"
                  placeholder="Age"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  disabled={applying}
                />

                <input
                  type="text"
                  placeholder="City"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={applying}
                />

                <textarea
                  placeholder="Your Experience (if any)"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[100px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                  disabled={applying}
                />

                <input
                  type="text"
                  placeholder="Availability (e.g., Full Day, Morning Only)"
                  className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  required
                  disabled={applying}
                />

                <button
                  disabled={applying}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
