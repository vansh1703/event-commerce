"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { checkSuperAdminAuth } from "@/lib/auth";
import * as XLSX from 'xlsx';

type Job = {
  id: string;
  requestId: string;
  companyEmail: string;
  companyName: string;
  title: string;
  eventType: string;
  location: string;
  helpersNeeded: number;
  date: string;
  time: string;
  payment: string;
  description: string;
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

type Rating = {
  stars: number;
  jobTitle: string;
  date: string;
};

type RedFlag = {
  date: string;
  reason: string;
  jobTitle: string;
};

type SeekerProfile = {
  name: string;
  email: string;
  phone: string;
  redFlags: RedFlag[];
  ratings: Rating[];
  bannedUntil: string | null;
};

export default function SuperAdminApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Application | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(null);

  // For flag/rating
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    if (!checkSuperAdminAuth()) {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [jobId]);

  const loadData = () => {
    const jobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const foundJob = jobs.find((j: Job) => j.id === jobId);
    
    if (!foundJob) {
      alert("Job not found!");
      router.push("/superadmin/dashboard");
      return;
    }

    setJob(foundJob);

    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    const jobApplicants = allApplications.filter(
      (app: Application) => app.jobId === jobId
    );
    setApplicants(jobApplicants);
  };

  const openApplicantDialog = (applicant: Application) => {
    setSelectedApplicant(applicant);
    
    const seekerAccounts = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );
    const profile = seekerAccounts.find(
      (acc: SeekerProfile) => acc.name === applicant.name
    );
    setSeekerProfile(profile || null);
    
    setShowDialog(true);
  };

  const updateStatus = (newStatus: "accepted" | "rejected") => {
    if (!selectedApplicant) return;

    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );

    const updatedApplications = allApplications.map((app: Application) => {
      if (app.jobId === jobId && app.name === selectedApplicant.name) {
        return { ...app, status: newStatus };
      }
      return app;
    });

    localStorage.setItem("applications", JSON.stringify(updatedApplications));
    
    alert(`Application ${newStatus === "accepted" ? "Accepted" : "Rejected"}!`);
    setShowDialog(false);
    loadData();
  };

  const markEventComplete = () => {
    const confirmed = window.confirm(
      `⚠️ Mark "${job?.title}" as complete?\n\n` +
      `This will:\n` +
      `✓ Remove job from active listings\n` +
      `✓ Enable rating and flagging\n` +
      `✓ Move to event history\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    const allJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    const updatedJobs = allJobs.map((j: Job) => {
      if (j.id === jobId) {
        return { ...j, completed: true };
      }
      return j;
    });

    localStorage.setItem("jobs", JSON.stringify(updatedJobs));
    loadData();
    alert("✅ Event marked as completed!");
  };

  const exportToExcel = () => {
    const acceptedApplicants = applicants.filter(app => app.status === "accepted");
    
    if (acceptedApplicants.length === 0) {
      alert("No accepted applicants to export!");
      return;
    }

    const exportData = acceptedApplicants.map(app => ({
      "Name": app.name,
      "Phone": app.phone,
      "Age": app.age,
      "City": app.city,
      "Availability": app.availability,
      "Experience": app.experience,
      "Applied On": app.appliedAt,
      "Status": "Accepted"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accepted Applicants");
    
    XLSX.writeFile(workbook, `${job?.title}_Accepted_Applicants.xlsx`);
  };

  const getSeekerStats = () => {
    if (!seekerProfile) return { redFlagCount: 0, avgRating: 0, isBanned: false };

    const redFlagCount = seekerProfile.redFlags?.length || 0;
    const ratings = seekerProfile.ratings || [];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length
        : 0;

    const isBanned = seekerProfile.bannedUntil
      ? new Date(seekerProfile.bannedUntil) > new Date()
      : false;

    return { redFlagCount, avgRating: avgRating.toFixed(1), isBanned };
  };

  const handleAddRedFlag = () => {
    if (!selectedApplicant || !flagReason.trim()) {
      alert("Please provide a reason for the red flag.");
      return;
    }

    const seekerAccounts: SeekerProfile[] = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );

    let alreadyFlagged = false;

    const updatedAccounts = seekerAccounts.map((acc) => {
      if (acc.name === selectedApplicant.name) {
        const existingFlags = acc.redFlags || [];
        
        if (existingFlags.some((flag: RedFlag) => flag.jobTitle === job?.title)) {
          alreadyFlagged = true;
          return acc;
        }

        const newRedFlags = [
          ...existingFlags,
          {
            date: new Date().toLocaleDateString(),
            reason: flagReason,
            jobTitle: job?.title || "",
          },
        ];

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

    if (alreadyFlagged) {
      alert("You have already flagged this user for this event!");
      return;
    }

    localStorage.setItem("seekerAccounts", JSON.stringify(updatedAccounts));

    alert("Red flag added successfully!");
    setShowFlagModal(false);
    setFlagReason("");
    loadData();
  };

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
              jobTitle: job?.title || "",
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
    loadData();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  if (!job) return null;

  const pendingApplicants = applicants.filter(app => app.status === "pending");
  const acceptedApplicants = applicants.filter(app => app.status === "accepted");
  const rejectedApplicants = applicants.filter(app => app.status === "rejected");

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/superadmin/dashboard")}
              className="text-indigo-600 hover:text-purple-600 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {job.title}
            </h1>
            <p className="text-gray-600 mt-1">
              🏢 {job.companyName} • {job.date} • Posted: {job.payment}
            </p>
          </div>

          <div className="flex gap-3">
            {!job.completed && (
              <button
                onClick={markEventComplete}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg"
              >
                ✓ Mark Complete
              </button>
            )}
            <button
              onClick={exportToExcel}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              📊 Export Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">{pendingApplicants.length}</p>
            <p className="text-yellow-600 font-semibold">Pending</p>
          </div>
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{acceptedApplicants.length}</p>
            <p className="text-green-600 font-semibold">Accepted</p>
          </div>
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{rejectedApplicants.length}</p>
            <p className="text-red-600 font-semibold">Rejected</p>
          </div>
        </div>

        {/* Applicants List */}
        {applicants.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500">No applicants yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending */}
            {pendingApplicants.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">⏳ Pending Applications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingApplicants.map((app, index) => (
                    <div
                      key={index}
                      onClick={() => openApplicantDialog(app)}
                      className="bg-white rounded-2xl shadow-lg p-4 border-2 border-yellow-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {getInitials(app.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">Applied: {app.appliedAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted */}
            {acceptedApplicants.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✓ Accepted Applications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {acceptedApplicants.map((app, index) => (
                    <div
                      key={index}
                      onClick={() => openApplicantDialog(app)}
                      className="bg-white rounded-2xl shadow-lg p-4 border-2 border-green-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {getInitials(app.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">Applied: {app.appliedAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejectedApplicants.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">✗ Rejected Applications</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {rejectedApplicants.map((app, index) => (
                    <div
                      key={index}
                      onClick={() => openApplicantDialog(app)}
                      className="bg-white rounded-2xl shadow-lg p-4 border-2 border-red-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer opacity-70"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {getInitials(app.name)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{app.name}</h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">Applied: {app.appliedAt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Applicant Detail Dialog */}
      {showDialog && selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header with Photo */}
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                {getInitials(selectedApplicant.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedApplicant.name}
                </h2>
                <span className={`${getStatusBadge(selectedApplicant.status)} px-4 py-2 rounded-full font-semibold text-sm shadow-lg inline-block`}>
                  {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                </span>

                {/* Stats */}
                {seekerProfile && (
                  <div className="flex gap-3 mt-3">
                    <span className="text-sm flex items-center gap-1">
                      ⭐ <span className="font-semibold">{Number(getSeekerStats().avgRating) > 0 ? getSeekerStats().avgRating : "No ratings"}</span>
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${getSeekerStats().redFlagCount > 0 ? 'text-red-600 font-semibold' : ''}`}>
                      🚩 <span>{getSeekerStats().redFlagCount} Red Flags</span>
                    </span>
                    {getSeekerStats().isBanned && (
                      <span className="text-red-600 font-bold text-sm">
                        🚫 BANNED
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">📱 {selectedApplicant.phone}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Age</p>
                <p className="font-semibold text-gray-800">{selectedApplicant.age} years</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">City</p>
                <p className="font-semibold text-gray-800">📍 {selectedApplicant.city}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                <p className="font-semibold text-gray-800">⏰ {selectedApplicant.availability}</p>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-gray-800">{selectedApplicant.experience}</p>
            </div>

            {/* Applied Date */}
            <p className="text-sm text-gray-500 mb-6">
              Applied on: {selectedApplicant.appliedAt}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {selectedApplicant.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus("accepted")}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    ✓ Accept
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    ✗ Reject
                  </button>
                </div>
              )}

              {selectedApplicant.status === "accepted" && job.completed && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowFlagModal(true)}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    🚩 Add Red Flag
                  </button>
                  <button
                    onClick={() => setShowRatingModal(true)}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-2xl hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 font-semibold shadow-lg"
                  >
                    ⭐ Rate Seeker
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowDialog(false)}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Flag Modal */}
      {showFlagModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Add Red Flag
            </h2>
            <p className="text-gray-600 mb-4">
              For: <span className="font-semibold">{selectedApplicant.name}</span>
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
      {showRatingModal && selectedApplicant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              Rate Seeker
            </h2>
            <p className="text-gray-600 mb-6">
              For: <span className="font-semibold">{selectedApplicant.name}</span>
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