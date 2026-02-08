"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";

type Job = {
  id: string;
  title: string;
  createdBy: string;
  date: string;
  completed?: boolean;
};

type Application = {
  jobId: string;
  name: string;
  phone: string;
  age: number;
  city: string;
  experience: string;
  availability: string;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
};

export default function DashboardPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posterEmail, setPosterEmail] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, [router]);

  const loadData = () => {
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setPosterEmail(parsedUser.email);

    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    
    // Only show active (not completed) jobs
    const myActiveJobs = storedJobs.filter(
      (job: Job) => job.createdBy === parsedUser.email && !job.completed && new Date(job.date) >= new Date()
    );
    
    setJobs(myActiveJobs);

    const storedApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    setApplications(storedApplications);
  };

  const getAllJobs = () => {
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    return storedJobs.filter(
      (job: Job) => job.createdBy === posterEmail
    );
  };

  const markEventComplete = (jobId: string, jobTitle: string) => {
    const confirmed = window.confirm(
      `⚠️ Are you sure you want to mark "${jobTitle}" as complete?\n\n` +
      `This job will be:\n` +
      `✓ Removed from your active jobs dashboard\n` +
      `✓ Removed from job seekers' active applications\n` +
      `✓ Moved to event history\n` +
      `✓ Available for rating and flagging applicants\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    const allJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const updatedJobs = allJobs.map((job: Job) => {
      if (job.id === jobId) {
        return { ...job, completed: true };
      }
      return job;
    });

    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
    loadData();
    alert("✅ Event marked as completed! You can now rate and flag applicants from Event History.");
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Poster Dashboard
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Logged in as:{" "}
            <span className="font-semibold text-indigo-600">{posterEmail}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
          <button
            onClick={() => router.push("/post")}
            className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl text-sm md:text-base"
          >
            + Post a Job
          </button>

          <LogoutButton />
        </div>
      </div>

      {/* Event History Toggle */}
      <div className="max-w-5xl mx-auto mb-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg"
        >
          {showHistory ? "Hide" : "Show"} Event History
        </button>
      </div>

      {/* Event History Sidebar */}
      {showHistory && (
        <div className="max-w-5xl mx-auto mb-8 bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">All My Events</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {getAllJobs().map((job: Job) => {
              const isCompleted = job.completed || new Date(job.date) < new Date();
              const jobApplicants = applications.filter(app => app.jobId === job.id);
              const acceptedCount = jobApplicants.filter(app => app.status === "accepted").length;
              
              return (
                <div
                  key={job.id}
                  className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => router.push(`/applicants/${job.id}`)}
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{job.title}</h4>
                    <p className="text-sm text-gray-600">Date: {job.date}</p>
                    <p className="text-sm text-gray-600">
                      {acceptedCount} accepted • {jobApplicants.length} total applicants
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted ? (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Completed
                      </span>
                    ) : (
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    )}
                    <span className="text-gray-400">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Jobs Section */}
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          My Active Jobs
        </h2>

        {jobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 md:p-8 text-center border border-white/20">
            <p className="text-gray-500 mb-4">
              You have no active jobs. Completed jobs are in Event History.
            </p>
            <button
              onClick={() => router.push("/post")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          jobs.map((job) => {
            const jobApplicants = applications.filter(
              (app) => app.jobId === job.id
            );
            const pendingCount = jobApplicants.filter(app => app.status === "pending").length;
            const acceptedCount = jobApplicants.filter(app => app.status === "accepted").length;
            const rejectedCount = jobApplicants.filter(app => app.status === "rejected").length;

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {/* Job Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Event Date: {job.date}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <button
                      onClick={() => router.push(`/applicants/${job.id}`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg text-center"
                    >
                      View Applicants ({jobApplicants.length})
                    </button>
                    
                    <button
                      onClick={() => markEventComplete(job.id, job.title)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                    >
                      ✓ Mark Complete
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 flex-wrap">
                  <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-full">
                    <span className="text-yellow-700 font-semibold text-sm">
                      ⏳ {pendingCount} Pending
                    </span>
                  </div>
                  <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                    <span className="text-green-700 font-semibold text-sm">
                      ✓ {acceptedCount} Accepted
                    </span>
                  </div>
                  <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-full">
                    <span className="text-red-700 font-semibold text-sm">
                      ✗ {rejectedCount} Rejected
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}