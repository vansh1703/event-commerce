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

type SeekerStats = {
  avgRating: string;
  ratings: Array<{ stars: number; job_title: string; date: string }>;
  redFlags: Array<{ reason: string; job_title: string; date: string }>;
  redFlagCount: number;
};

export default function CompletedEventsPage() {
  const router = useRouter();
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<SeekerStats | null>(null);
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
    await loadData(parsedUser.id);
  };

  const loadData = async (seekerId: string) => {
    try {
      // Load applications
      const appsRes = await fetch(`/api/applications?seekerId=${seekerId}`, {
        method: 'GET',
      });
      const appsData = await appsRes.json();

      // Load all jobs
      const jobsRes = await fetch('/api/jobs', { method: 'GET' });
      const jobsData = await jobsRes.json();

      // Load stats
      const statsRes = await fetch(`/api/seekers/${seekerId}/stats`, {
        method: 'GET',
      });
      const statsData = await statsRes.json();

      if (appsData.success && jobsData.success && statsData.success) {
        setApplications(appsData.applications);
        setJobs(jobsData.jobs);
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find((job) => job.id === jobId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading completed events...</p>
        </div>
      </div>
    );
  }

  const completedApplications = applications.filter((app) => {
    const job = getJobDetails(app.job_id);
    if (!job) return false;
    if (app.status !== "accepted") return false;
    // ✅ Changed: Use event_end_date instead of date
    return job.completed || new Date(job.event_end_date) < new Date();
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Completed Events ({completedApplications.length})
        </h1>

        {completedApplications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 text-center border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No completed events yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {completedApplications.map((app) => {
              const job = getJobDetails(app.job_id);
              if (!job) return null;

              const jobRating = stats?.ratings.find((r) => r.job_title === job.title);
              const jobFlag = stats?.redFlags.find((f) => f.job_title === job.title);

              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                        {job.title}
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
                    </div>

                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                      ✓ Completed
                    </span>
                  </div>

                  {jobRating && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-4 mb-3">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Your Rating:
                      </p>
                      <p className="text-yellow-600 dark:text-yellow-400">
                        {"⭐".repeat(jobRating.stars)} ({jobRating.stars}/5)
                      </p>
                      <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">{jobRating.date}</p>
                    </div>
                  )}

                  {jobFlag && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl p-4 mb-3">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                        🚩 Red Flag:
                      </p>
                      <p className="text-red-600 dark:text-red-400">{jobFlag.reason}</p>
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">{jobFlag.date}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-semibold">Completed on:</span>{" "}
                      {job.event_end_date}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}