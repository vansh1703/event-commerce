"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";

type Job = {
  id: string;
  title: string;
  createdBy: string;
};

type Application = {
  jobId: string;
  name: string;
  phone: string;
  appliedAt: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posterEmail, setPosterEmail] = useState("");

  useEffect(() => {
    // ✅ Protect Dashboard
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setPosterEmail(parsedUser.email);

    // ✅ Load Jobs
    const storedJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    // Only jobs created by this poster
    const myJobs = storedJobs.filter(
      (job: Job) => job.createdBy === parsedUser.email
    );

    setJobs(myJobs);

    // ✅ Load Applications
    const storedApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    setApplications(storedApplications);
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Poster Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Logged in as: <span className="font-semibold text-indigo-600">{posterEmail}</span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* ✅ POST JOB BUTTON */}
          <button
            onClick={() => router.push("/post")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
          >
            + Post a Job
          </button>
          
          <LogoutButton />
        </div>
      </div>

      {/* Jobs Section */}
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Posted Jobs</h2>

        {jobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-8 text-center border border-white/20">
            <p className="text-gray-500 mb-4">
              You have not posted any jobs yet.
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
            // Applicants for this job
            const jobApplicants = applications.filter(
              (app) => app.jobId === job.id
            );

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {/* Job Title */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-semibold text-gray-800">{job.title}</h3>

                  <span className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2 rounded-full font-semibold shadow-lg">
                    {jobApplicants.length} Applicants
                  </span>
                </div>

                {/* Applicants List */}
                <div>
                  {jobApplicants.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-6 text-center">
                      <p className="text-gray-400">
                        No one has applied yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobApplicants.map((app, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <p className="font-bold text-gray-900 text-lg">{app.name}</p>
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                              {app.appliedAt}
                            </span>
                          </div>
                          <p className="text-gray-700 font-medium">
                            📱 {app.phone}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}