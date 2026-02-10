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
        method: 'GET',
      });
      const appsData = await appsRes.json();

      // Load all jobs
      const jobsRes = await fetch('/api/jobs', { method: 'GET' });
      const jobsData = await jobsRes.json();

      if (appsData.success && jobsData.success) {
        setApplications(appsData.applications);
        setJobs(jobsData.jobs);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
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
        method: 'DELETE',
      });

      const data = await res.json();

      if (data.success) {
        alert("Application withdrawn successfully!");
        await loadApplications(seekerUser.id);
      }
    } catch (error: any) {
      alert(error.message || 'Failed to withdraw application');
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  const activeApplications = applications.filter((app) => {
    const job = getJobDetails(app.job_id);
    if (!job) return false;
    if (job.completed) return false;
    const eventDate = new Date(job.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Applications ({activeApplications.length})
        </h1>

        {activeApplications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500 mb-4">No active applications yet.</p>
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

                    <span
                      className={`${getStatusBadge(
                        app.status
                      )} px-4 py-2 rounded-full font-semibold text-sm shadow-lg`}
                    >
                      {app.status === "pending" && "⏳ Pending Review"}
                      {app.status === "accepted" && "✓ Accepted"}
                      {app.status === "rejected" && "✗ Rejected"}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <p className="text-sm text-gray-600">
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