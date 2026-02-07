"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";

type Job = {
  id: string;
  title: string;
  createdBy: string;
  date: string;
  completed?: boolean; // Add this
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

type RedFlag = {
  date: string;
  reason: string;
  jobTitle: string;
};

type Rating = {
  stars: number;
  jobTitle: string;
  date: string;
};

type SeekerProfile = {
  name: string;
  email: string;
  password: string;
  phone: string;
  redFlags: RedFlag[];
  ratings: Rating[];
  bannedUntil: string | null;
};

export default function DashboardPage() {
  const router = useRouter();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [posterEmail, setPosterEmail] = useState("");

  // Modal states
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<{
    name: string;
    jobId: string;
    jobTitle: string;
  } | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [rating, setRating] = useState(5);

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
    const myJobs = storedJobs.filter(
      (job: Job) => job.createdBy === parsedUser.email
    );
    setJobs(myJobs);

    const storedApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    setApplications(storedApplications);
  };

  // Mark event as completed
  const markEventComplete = (jobId: string) => {
    const allJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const updatedJobs = allJobs.map((job: Job) => {
      if (job.id === jobId) {
        return { ...job, completed: true };
      }
      return job;
    });

    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
    loadData();
    alert("Event marked as completed! You can now rate and flag applicants.");
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

  // Get seeker stats
  const getSeekerStats = (seekerName: string) => {
    const seekerAccounts: SeekerProfile[] = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );

    const profile = seekerAccounts.find((acc) => acc.name === seekerName);

    if (!profile) {
      return { redFlagCount: 0, avgRating: 0, isBanned: false };
    }

    const redFlagCount = profile.redFlags?.length || 0;
    const ratings = profile.ratings || [];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
        : 0;

    const isBanned = profile.bannedUntil
      ? new Date(profile.bannedUntil) > new Date()
      : false;

    return { redFlagCount, avgRating: avgRating.toFixed(1), isBanned };
  };

  // Add Red Flag
  const handleAddRedFlag = () => {
    if (!selectedApplicant || !flagReason.trim()) {
      alert("Please provide a reason for the red flag.");
      return;
    }

    const seekerAccounts: SeekerProfile[] = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );

    const updatedAccounts = seekerAccounts.map((acc) => {
      if (acc.name === selectedApplicant.name) {
        const newRedFlags = [
          ...(acc.redFlags || []),
          {
            date: new Date().toLocaleDateString(),
            reason: flagReason,
            jobTitle: selectedApplicant.jobTitle,
          },
        ];

        // Ban if 3 or more red flags
        let bannedUntil = acc.bannedUntil;
        if (newRedFlags.length >= 3) {
          const banDate = new Date();
          banDate.setDate(banDate.getDate() + 30);
          bannedUntil = banDate.toISOString();
        }

        return {
          ...acc,
          redFlags: newRedFlags,
          bannedUntil,
        };
      }
      return acc;
    });

    localStorage.setItem("seekerAccounts", JSON.stringify(updatedAccounts));

    alert("Red flag added successfully!");
    setShowFlagModal(false);
    setFlagReason("");
    setSelectedApplicant(null);
    loadData();
  };

  // Add Rating
  const handleAddRating = () => {
    if (!selectedApplicant) return;

    const seekerAccounts: SeekerProfile[] = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );

    const updatedAccounts = seekerAccounts.map((acc) => {
      if (acc.name === selectedApplicant.name) {
        return {
          ...acc,
          ratings: [
            ...(acc.ratings || []),
            {
              stars: rating,
              jobTitle: selectedApplicant.jobTitle,
              date: new Date().toLocaleDateString(),
            },
          ],
        };
      }
      return acc;
    });

    localStorage.setItem("seekerAccounts", JSON.stringify(updatedAccounts));

    alert("Rating added successfully!");
    setShowRatingModal(false);
    setRating(5);
    setSelectedApplicant(null);
    loadData();
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Event Date: {job.date}
                      {job.completed && (
                        <span className="ml-2 text-green-600 font-semibold">
                          ✓ Completed
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-5 py-2 rounded-full font-semibold shadow-lg text-center">
                      {jobApplicants.length} Applicants
                    </span>
                    
                    {/* Mark Complete Button */}
                    {!job.completed && (
                      <button
                        onClick={() => markEventComplete(job.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg text-sm"
                      >
                        ✓ Mark Complete
                      </button>
                    )}
                  </div>
                </div>

                {/* Applicants List */}
                <div>
                  {jobApplicants.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl p-4 md:p-6 text-center">
                      <p className="text-gray-400">No one has applied yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobApplicants.map((app, index) => {
                        const stats = getSeekerStats(app.name);

                        return (
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

                                {/* Seeker Stats */}
                                <div className="flex gap-3 mt-2 text-sm">
                                  <span className="flex items-center gap-1">
                                    ⭐{" "}
                                    <span className="font-semibold">
                                      {typeof stats.avgRating === "number" && stats.avgRating > 0
                                        ? stats.avgRating
                                        : "No ratings"}
                                    </span>
                                  </span>
                                  <span
                                    className={`flex items-center gap-1 ${
                                      stats.redFlagCount > 0
                                        ? "text-red-600 font-semibold"
                                        : ""
                                    }`}
                                  >
                                    🚩{" "}
                                    <span>
                                      {stats.redFlagCount} Red Flag
                                      {stats.redFlagCount !== 1 ? "s" : ""}
                                    </span>
                                  </span>
                                  {stats.isBanned && (
                                    <span className="text-red-600 font-bold">
                                      🚫 BANNED
                                    </span>
                                  )}
                                </div>
                              </div>

                              <span
                                className={`${getStatusBadge(
                                  app.status || "pending"
                                )} px-3 md:px-4 py-1 md:py-2 rounded-full font-semibold text-xs md:text-sm shadow-lg`}
                              >
                                {(app.status || "pending")
                                  .charAt(0)
                                  .toUpperCase() +
                                  (app.status || "pending").slice(1)}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm md:text-base mb-3">
                              <p className="text-gray-600">
                                <span className="font-medium">Age:</span>{" "}
                                {app.age}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">City:</span>{" "}
                                {app.city}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">
                                  Availability:
                                </span>{" "}
                                {app.availability}
                              </p>
                              <p className="text-gray-600">
                                <span className="font-medium">Applied:</span>{" "}
                                {app.appliedAt}
                              </p>
                            </div>

                            {app.experience && (
                              <p className="text-gray-600 mb-3 text-sm md:text-base">
                                <span className="font-medium">
                                  Experience:
                                </span>{" "}
                                {app.experience}
                              </p>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-2">
                              {/* Accept/Reject - Only for Pending */}
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

                              {/* Flag & Rate - Only for Accepted + Event Completed */}
                              {app.status === "accepted" && job.completed && (
                                <div className="flex gap-2 md:gap-3">
                                  <button
                                    onClick={() => {
                                      setSelectedApplicant({
                                        name: app.name,
                                        jobId: job.id,
                                        jobTitle: job.title,
                                      });
                                      setShowFlagModal(true);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-2 md:py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                                  >
                                    🚩 Add Red Flag
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplicant({
                                        name: app.name,
                                        jobId: job.id,
                                        jobTitle: job.title,
                                      });
                                      setShowRatingModal(true);
                                    }}
                                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-2 md:py-3 rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                                  >
                                    ⭐ Rate Seeker
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Red Flag Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Add Red Flag
            </h2>
            <p className="text-gray-600 mb-4">
              For: <span className="font-semibold">{selectedApplicant?.name}</span>
            </p>
            <textarea
              placeholder="Reason for red flag (e.g., Did not show up to event)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason("");
                  setSelectedApplicant(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRedFlag}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg"
              >
                Add Flag
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Rate Seeker
            </h2>
            <p className="text-gray-600 mb-6">
              For: <span className="font-semibold">{selectedApplicant?.name}</span>
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-5xl transition-all ${
                    star <= rating
                      ? "text-yellow-500 scale-110"
                      : "text-gray-300"
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>

            <p className="text-center text-gray-600 mb-6">
              Rating: <span className="font-bold text-2xl">{rating}/5</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(5);
                  setSelectedApplicant(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRating}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-2xl hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold shadow-lg"
              >
                Submit Rating
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}