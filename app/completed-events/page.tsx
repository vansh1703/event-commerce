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
  date: string;
  time: string;
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading completed events...</p>
        </div>
      </div>
    );
  }

  const completedApplications = applications.filter((app) => {
    const job = getJobDetails(app.job_id);
    if (!job) return false;
    if (app.status !== "accepted") return false;
    return job.completed || new Date(job.date) < new Date();
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Completed Events ({completedApplications.length})
        </h1>

        {completedApplications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No completed events yet.</p>
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
                  className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-800 mb-2">
                        {job.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {job.event_type} • {job.location}
                      </p>
                      <p className="text-sm text-gray-600">
                        📅 {job.date} at {job.time}
                      </p>
                      <p className="text-sm text-gray-600">💰 {job.payment}</p>
                    </div>

                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                      ✓ Completed
                    </span>
                  </div>

                  {jobRating && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
                      <p className="text-sm font-semibold text-yellow-800 mb-1">
                        Your Rating:
                      </p>
                      <p className="text-yellow-600">
                        {"⭐".repeat(jobRating.stars)} ({jobRating.stars}/5)
                      </p>
                      <p className="text-xs text-yellow-500 mt-1">{jobRating.date}</p>
                    </div>
                  )}

                  {jobFlag && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
                      <p className="text-sm font-semibold text-red-800 mb-1">
                        🚩 Red Flag:
                      </p>
                      <p className="text-red-600">{jobFlag.reason}</p>
                      <p className="text-xs text-red-500 mt-1">{jobFlag.date}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Completed on:</span> {job.date}
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