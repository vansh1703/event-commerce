"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";

type Application = {
  id: string;
  job_id: string;
  name: string;
  phone: string;
  age: number;
  city: string;
  experience: string;
  availability: string;
  applied_at: string;
  status: "pending" | "accepted" | "rejected";
};

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  event_start_date: string;  // ✅ Changed
  event_end_date: string;    // ✅ Changed
  event_start_time: string;  // ✅ Changed
  event_end_time: string;    // ✅ Changed
  payment: string;
  completed: boolean;
};

export default function MyApplicationsPage() {
  const router = useRouter();
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = localStorage.getItem("seekerUser");

    if (!user) {
      router.push("/seeker/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setSeekerUser(parsedUser);
    await loadApplications(parsedUser.id);
  };

  const loadApplications = async (seekerId: string) => {
    try {
      // Load applications
      const appsRes = await fetch(`/api/applications?seekerId=${seekerId}`, {
        method: "GET",
      });
      const appsData = await appsRes.json();

      // Load all jobs
      const jobsRes = await fetch("/api/jobs", { method: "GET" });
      const jobsData = await jobsRes.json();

      if (appsData.success && jobsData.success) {
        setApplications(appsData.applications);
        setJobs(jobsData.jobs);
      }
    } catch (error) {
      console.error("Error loading applications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Application withdrawn successfully!");
        await loadApplications(seekerUser.id);
      }
    } catch (error: any) {
      alert(error.message || "Failed to withdraw application");
    }
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find((job) => job.id === jobId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      case "rejected":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white";
      default:
        return "bg-gradient-to-r from-yellow-500 to-orange-600 text-white";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading applications...</p>
        </div>
      </div>
    );
  }

  const activeApplications = applications.filter((app) => {
    const job = getJobDetails(app.job_id);
    if (!job) return false;
    if (job.completed) return false;
    // ✅ Changed: Use event_end_date instead of date
    const eventDate = new Date(job.event_end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Applications ({activeApplications.length})
        </h1>

        {activeApplications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No active applications yet.</p>
            <button
              onClick={() => router.push("/events")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Browse Available Jobs
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {activeApplications.map((app) => {
              const job = getJobDetails(app.job_id);
              if (!job) return null;

              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
                >
                  {/* ✅ UPDATED: Make job title clickable */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div
                      className="flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => router.push(`/events/${job.id}`)}
                    >
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {job.title} →
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {job.event_type} • {job.location}
                      </p>
                      
                      {/* ✅ DATE RANGE DISPLAY */}
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        📅 {job.event_start_date === job.event_end_date 
                          ? job.event_start_date 
                          : `${job.event_start_date} to ${job.event_end_date}`}
                      </p>
                      
                      {/* ✅ TIME RANGE DISPLAY */}
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        🕐 {job.event_start_time === job.event_end_time 
                          ? job.event_start_time 
                          : `${job.event_start_time} - ${job.event_end_time}`}
                      </p>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300">💰 {job.payment}</p>
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                        Click to view job details
                      </p>
                    </div>

                    <span
                      className={`${getStatusBadge(
                        app.status
                      )} px-4 py-2 rounded-full font-semibold text-sm shadow-lg flex-shrink-0`}
                    >
                      {app.status === "pending" && "⏳ Pending Review"}
                      {app.status === "accepted" && "✓ Accepted"}
                      {app.status === "rejected" && "✗ Rejected"}
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Applied on:</span>{" "}
                      {new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>

                  {app.status === "pending" && (
                    <button
                      onClick={() => handleWithdraw(app.id)}
                      className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg"
                    >
                      Withdraw Application
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}