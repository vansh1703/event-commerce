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

  useEffect(() => {
    loadData();
  }, [router]);

  const loadData = () => {
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
    const myJobs = storedJobs.filter(
      (job: Job) => job.createdBy === parsedUser.email
    );
    setJobs(myJobs);

    // ✅ Load Applications
    const storedApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    setApplications(storedApplications);
  };

  const updateApplicationStatus = (
    jobId: string,
    applicantName: string,
    newStatus: "accepted" | "rejected"
  ) => {
    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    const updatedApplications = allApplications.map((app: Application) => {
      if (app.jobId === jobId && app.name === applicantName) {
        return { ...app, status: newStatus };
      }
      return app;
    });

    localStorage.setItem("applications", JSON.stringify(updatedApplications));
    setApplications(updatedApplications);

    alert(
      `Application ${newStatus === "accepted" ? "Accepted" : "Rejected"}!`
    );
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

      {/* Jobs Section */}
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-6">
          My Posted Jobs
        </h2>

        {jobs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 md:p-8 text-center border border-white/20">
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
            const jobApplicants = applications.filter(
              (app) => app.jobId === job.id
            );

            return (
              <div
                key={job.id}
                className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {/* Job Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                  <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                    {job.title}
                  </h3>

                  <span className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-5 py-2 rounded-full font-semibold shadow-lg">
                    {jobApplicants.length} Applicants
                  </span>
                </div>

                {/* Applicants List */}
                <div>
                  {jobApplicants.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-4 md:p-6 text-center">
                      <p className="text-gray-400">No one has applied yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobApplicants.map((app, index) => (
                        <div
                          key={index}
                          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-4 md:p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                            <div className="flex-1">
                              <p className="font-bold text-gray-900 text-base md:text-lg">
                                {app.name}
                              </p>
                              <p className="text-gray-700 font-medium text-sm md:text-base">
                                📱 {app.phone}
                              </p>
                            </div>

                            <span
                              className={`${getStatusBadge(
                                app.status || "pending"
                              )} px-3 md:px-4 py-1 md:py-2 rounded-full font-semibold text-xs md:text-sm shadow-lg`}
                            >
                              {(app.status || "pending").charAt(0).toUpperCase() +
                                (app.status || "pending").slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base mb-3">
                            <p className="text-gray-600">
                              <span className="font-medium">Age:</span> {app.age}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">City:</span> {app.city}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Availability:</span>{" "}
                              {app.availability}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-medium">Applied:</span>{" "}
                              {app.appliedAt}
                            </p>
                          </div>

                          {app.experience && (
                            <p className="text-gray-600 mb-3 text-sm md:text-base">
                              <span className="font-medium">Experience:</span>{" "}
                              {app.experience}
                            </p>
                          )}

                          {/* Action Buttons */}
                          {app.status === "pending" && (
                            <div className="flex gap-2 md:gap-3">
                              <button
                                onClick={() =>
                                  updateApplicationStatus(
                                    job.id,
                                    app.name,
                                    "accepted"
                                  )
                                }
                                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 md:py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                              >
                                ✓ Accept
                              </button>
                              <button
                                onClick={() =>
                                  updateApplicationStatus(
                                    job.id,
                                    app.name,
                                    "rejected"
                                  )
                                }
                                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 md:py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          )}
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