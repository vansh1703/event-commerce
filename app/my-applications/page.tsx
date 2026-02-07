"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";

/* =======================
   TYPES
======================= */

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

type Job = {
  id: string;
  title: string;
  eventType: string;
  location: string;
  payment: string;
  date: string;
  time: string;
};

type ApplicationWithJob = Application & {
  job: Job;
};

type SeekerUser = {
  name: string;
  email?: string;
};

/* =======================
   COMPONENT
======================= */

export default function MyApplicationsPage() {
  const router = useRouter();

  const [myApplications, setMyApplications] = useState<ApplicationWithJob[]>([]);
  const [seekerUser, setSeekerUser] = useState<SeekerUser | null>(null);

  useEffect(() => {
    loadApplications();
  }, [router]);

  const loadApplications = () => {
    /* -------- Auth Check -------- */
    const storedUser = localStorage.getItem("seekerUser");

    if (!storedUser) {
      router.push("/seeker/login");
      return;
    }

    const parsedUser: SeekerUser = JSON.parse(storedUser);
    setSeekerUser(parsedUser);

    /* -------- Load Data -------- */
    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    ) as (Application & { status?: "pending" | "accepted" | "rejected" })[];

    const jobs = JSON.parse(
      localStorage.getItem("jobs") || "[]"
    ) as Job[];

    /* -------- Filter & Map -------- */
    const userApplications: ApplicationWithJob[] = allApplications
      .filter(app => app.name === parsedUser.name)
      .map(app => {
        const job = jobs.find(j => j.id === app.jobId);
        if (!job) return null;
        
        const typedApp: Application = {
          jobId: app.jobId,
          name: app.name,
          phone: app.phone,
          age: app.age,
          city: app.city,
          experience: app.experience,
          availability: app.availability,
          appliedAt: app.appliedAt,
          status: app.status || "pending"
        };
        
        return { ...typedApp, job };
      })
      .filter((app): app is ApplicationWithJob => app !== null);

    setMyApplications(userApplications);
  };

  /* =======================
     WITHDRAW APPLICATION
  ======================= */

  const handleWithdraw = (jobId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to withdraw this application?"
    );

    if (!confirm) return;

    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    const updatedApplications = allApplications.filter(
      (app: Application) =>
        !(app.jobId === jobId && app.name === seekerUser?.name)
    );

    localStorage.setItem("applications", JSON.stringify(updatedApplications));

    alert("Application withdrawn successfully!");
    loadApplications();
  };

  /* =======================
     HELPERS
  ======================= */

  const getStatusBadge = (status: "pending" | "accepted" | "rejected") => {
    switch (status) {
      case "accepted":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      case "rejected":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white";
      default:
        return "bg-gradient-to-r from-yellow-500 to-orange-600 text-white";
    }
  };

  const getStatusIcon = (status: "pending" | "accepted" | "rejected") => {
    switch (status) {
      case "accepted":
        return "✓";
      case "rejected":
        return "✗";
      default:
        return "⏳";
    }
  };

  /* =======================
     UI
  ======================= */

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          My Applications
        </h1>

        {myApplications.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center border border-gray-100">
            <p className="text-gray-500 mb-4">
              You haven't applied to any jobs yet.
            </p>
            <button
              onClick={() => router.push("/events")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {myApplications.map((app, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300"
              >
                {/* Job Title & Status */}
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                      {app.job.title}
                    </h2>
                    <div className="space-y-1 text-sm md:text-base">
                      <p className="text-gray-600">
                        <span className="font-medium">Type:</span>{" "}
                        {app.job.eventType}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {app.job.location}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {app.job.date} at {app.job.time}
                      </p>
                      <p className="text-gray-800 font-bold">
                        <span className="font-medium">Payment:</span>{" "}
                        {app.job.payment}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    <span
                      className={`${getStatusBadge(
                        app.status
                      )} px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg inline-flex items-center gap-2`}
                    >
                      <span className="text-lg md:text-xl">
                        {getStatusIcon(app.status)}
                      </span>
                      {app.status.charAt(0).toUpperCase() +
                        app.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Application Details */}
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <p className="text-xs md:text-sm text-gray-500 mb-3">
                    Applied on: {app.appliedAt}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 text-sm md:text-base">
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
                      <span className="font-medium">Phone:</span> {app.phone}
                    </p>
                  </div>

                  {app.experience && (
                    <p className="text-gray-600 mt-3 text-sm md:text-base">
                      <span className="font-medium">Experience:</span>{" "}
                      {app.experience}
                    </p>
                  )}

                  {/* Withdraw Button - Only for Pending */}
                  {app.status === "pending" && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleWithdraw(app.jobId)}
                        className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                      >
                        Withdraw Application
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}