"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { checkSuperAdminAuth } from "@/lib/auth";
import { apiCall } from "@/lib/api";
import * as XLSX from "xlsx";

type Job = {
  id: string;
  request_id: string;
  company_id: string;
  company_name: string;
  created_by: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  date: string;
  time: string;
  payment: string;
  description: string;
  contact_phone: string;
  completed: boolean;
  created_at: string;
  archived: boolean;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
};

type Application = {
  id: string;
  job_id: string;
  seeker_id: string;
  name: string;
  phone: string;
  age: number;
  city: string;
  experience: string;
  availability: string;
  applied_at: string;
  status: "pending" | "accepted" | "rejected";
  custom_data?: any;
};

type SeekerStats = {
  seekerInfo: {
    full_name: string;
    email: string;
    phone: string;
    profile_photo: string;
    id_proof_photo: string;
  } | null;
  avgRating: string;
  ratings: any[];
  redFlags: any[];
  redFlagCount: number;
  isBanned: boolean;
  bannedUntil: string | null;
};

export default function SuperAdminApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [job, setJob] = useState<Job | null>(null);
  const [applicants, setApplicants] = useState<Application[]>([]);
  const [selectedApplicant, setSelectedApplicant] =
    useState<Application | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [seekerStats, setSeekerStats] = useState<SeekerStats | null>(null);

  // For flag/rating
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [rating, setRating] = useState(5);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!checkSuperAdminAuth()) {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [jobId, router]);

  const toggleArchive = async () => {
    if (!job) return;

    const acceptedCount = applicants.filter(
      (app) => app.status === "accepted",
    ).length;
    const totalCount = applicants.length;
    const required = job.helpers_needed;

    // UNARCHIVE LOGIC
    if (job.archived) {
      // Check conditions before unarchiving
      if (acceptedCount === required) {
        alert(
          "✅ You have already accepted the required number of candidates!",
        );
        return;
      }

      if (totalCount >= required * 2) {
        alert(
          "⚠️ Your application bucket is full! Please accept or reject pending candidates before unarchiving.",
        );
        return;
      }

      if (acceptedCount < required) {
        const confirm = window.confirm(
          `Unarchive this job?\n\n` +
            `This will make it visible to job seekers again.\n` +
            `Accepted: ${acceptedCount}/${required}\n` +
            `Total Applications: ${totalCount}/${required * 2}`,
        );

        if (!confirm) return;
      }
    } else {
      // ARCHIVE LOGIC
      const confirm = window.confirm(
        `Archive this job?\n\n` +
          `This will hide it from job seekers.\n` +
          `They won't be able to apply anymore.`,
      );

      if (!confirm) return;
    }

    setProcessing(true);

    try {
      const data = await apiCall(`/jobs/${jobId}/archive`, {
        method: "POST",
        body: JSON.stringify({ archived: !job.archived }),
      });

      if (data.success) {
        alert(
          job.archived
            ? "✅ Job unarchived successfully!"
            : "✅ Job archived successfully!",
        );
        await loadData();
      }
    } catch (error: any) {
      alert(error.message || "Failed to archive/unarchive job");
    } finally {
      setProcessing(false);
    }
  };

  const loadData = async () => {
    try {
      // Load job details
      const jobsData = await apiCall("/jobs", { method: "GET" });

      if (jobsData.success) {
        const foundJob = jobsData.jobs.find((j: Job) => j.id === jobId);

        if (!foundJob) {
          alert("Job not found!");
          router.push("/superadmin/dashboard");
          return;
        }

        setJob(foundJob);
      }

      // Load applications for this job
      const appsData = await apiCall(`/applications?jobId=${jobId}`, {
        method: "GET",
      });

      if (appsData.success) {
        setApplicants(appsData.applications || []);
      }
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert("Failed to load job details");
    } finally {
      setLoading(false);
    }
  };

  const openApplicantDialog = async (applicant: Application) => {
    setSelectedApplicant(applicant);

    try {
      // Fetch seeker stats
      const statsData = await apiCall(`/seekers/${applicant.seeker_id}/stats`, {
        method: "GET",
      });

      if (statsData.success) {
        setSeekerStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error loading seeker stats:", error);
      setSeekerStats(null);
    }

    setShowDialog(true);
  };

  const updateStatus = async (newStatus: "accepted" | "rejected") => {
    if (!selectedApplicant) return;

    setProcessing(true);

    try {
      const data = await apiCall(`/applications/${selectedApplicant.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      if (data.success) {
        alert(
          `Application ${newStatus === "accepted" ? "Accepted" : "Rejected"}!`,
        );
        setShowDialog(false);
        await loadData();
      }
    } catch (error: any) {
      alert(error.message || "Failed to update application status");
    } finally {
      setProcessing(false);
    }
  };

  const markEventComplete = async () => {
    const confirmed = window.confirm(
      `⚠️ Mark "${job?.title}" as complete?\n\n` +
        `This will:\n` +
        `✓ Remove job from active listings\n` +
        `✓ Enable rating and flagging\n` +
        `✓ Move to event history\n\n` +
        `Continue?`,
    );

    if (!confirmed) return;

    setProcessing(true);

    try {
      const data = await apiCall(`/jobs/${jobId}/complete`, {
        method: "POST",
      });

      if (data.success) {
        alert("✅ Event marked as completed!");
        await loadData();
      }
    } catch (error: any) {
      alert(error.message || "Failed to mark event as complete");
    } finally {
      setProcessing(false);
    }
  };

  const exportToExcel = async () => {
    // 1. Filter for accepted applicants
    const acceptedApplicants = applicants.filter(
      (app) => app.status === "accepted",
    );

    if (acceptedApplicants.length === 0) {
      alert("No accepted applicants to export!");
      return;
    }

    // 2. Map through applicants and fetch their extra data (photos)
    const exportDataPromises = acceptedApplicants.map(async (app) => {
      try {
        const statsRes = await fetch(`/api/seekers/${app.seeker_id}/stats`);
        const statsData = await statsRes.json();

        // Extract seekerInfo safely
        const info = statsData.success ? statsData.stats.seekerInfo : null;

        return {
          Name: app.name,
          Phone: app.phone,
          Age: app.age,
          City: app.city,
          Availability: app.availability,
          Experience: app.experience,
          "Applied On": new Date(app.applied_at).toLocaleDateString(),
          Status: "Accepted",
          // Added the Photo URLs similar to your reference function
          "Profile Photo URL": info?.profile_photo ?? "Not available",
          "ID Proof URL": info?.id_proof_photo ?? "Not available",
        };
      } catch (error) {
        console.error(`Error fetching stats for ${app.name}:`, error);
        return {
          Name: app.name,
          Phone: app.phone,
          Age: app.age,
          City: app.city,
          Availability: app.availability,
          Experience: app.experience,
          "Applied On": new Date(app.applied_at).toLocaleDateString(),
          Status: "Accepted",
          "Profile Photo URL": "Error loading",
          "ID Proof URL": "Error loading",
        };
      }
    });

    // 3. Wait for all API calls to finish
    const exportData = await Promise.all(exportDataPromises);

    // 4. Create the Excel workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accepted Applicants");

    // 5. Save the file
    XLSX.writeFile(workbook, `${job?.title || "Job"}_Accepted_Applicants.xlsx`);

    alert("✅ Exported successfully with seeker photos!");
  };

  const getSeekerStatsDisplay = () => {
    if (!seekerStats) return { redFlagCount: 0, avgRating: 0, isBanned: false };

    return {
      redFlagCount: seekerStats.redFlagCount || 0,
      avgRating: seekerStats.avgRating || 0,
      isBanned: seekerStats.isBanned || false,
    };
  };

  const handleAddRedFlag = async () => {
    if (!selectedApplicant || !flagReason.trim()) {
      alert("Please provide a reason for the red flag.");
      return;
    }

    setProcessing(true);

    try {
      const data = await apiCall("/red-flags", {
        method: "POST",
        body: JSON.stringify({
          seekerId: selectedApplicant.seeker_id,
          jobId: job?.id,
          jobTitle: job?.title || "",
          reason: flagReason,
        }),
      });

      if (data.success) {
        alert("Red flag added successfully!");
        setShowFlagModal(false);
        setFlagReason("");

        // Reload seeker stats
        if (selectedApplicant) {
          const statsData = await apiCall(
            `/seekers/${selectedApplicant.seeker_id}/stats`,
            { method: "GET" },
          );
          if (statsData.success) {
            setSeekerStats(statsData.stats);
          }
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to add red flag");
    } finally {
      setProcessing(false);
    }
  };

  const handleAddRating = async () => {
    if (!selectedApplicant) return;

    setProcessing(true);

    try {
      const data = await apiCall("/ratings", {
        method: "POST",
        body: JSON.stringify({
          seekerId: selectedApplicant.seeker_id,
          jobId: job?.id,
          jobTitle: job?.title || "",
          stars: rating,
        }),
      });

      if (data.success) {
        alert("Rating added successfully!");
        setShowRatingModal(false);
        setRating(5);

        // Reload seeker stats
        if (selectedApplicant) {
          const statsData = await apiCall(
            `/seekers/${selectedApplicant.seeker_id}/stats`,
            { method: "GET" },
          );
          if (statsData.success) {
            setSeekerStats(statsData.stats);
          }
        }
      }
    } catch (error: any) {
      alert(error.message || "Failed to add rating");
    } finally {
      setProcessing(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applicants...</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const pendingApplicants = applicants.filter(
    (app) => app.status === "pending",
  );
  const acceptedApplicants = applicants.filter(
    (app) => app.status === "accepted",
  );
  const rejectedApplicants = applicants.filter(
    (app) => app.status === "rejected",
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/superadmin/dashboard")}
              className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {job.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              🏢 {job.company_name} • 📅{" "}
              {job.event_start_date === job.event_end_date
                ? job.event_start_date
                : `${job.event_start_date} to ${job.event_end_date}`}{" "}
              • 💰 Posted: {job.payment}
            </p>
            {job.archived && (
              <span className="inline-block mt-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-semibold">
                📦 ARCHIVED
              </span>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={toggleArchive}
              disabled={processing}
              className={`${
                job.archived
                  ? "bg-gradient-to-r from-orange-500 to-yellow-600"
                  : "bg-gradient-to-r from-gray-500 to-gray-600"
              } text-white px-6 py-3 rounded-2xl hover:opacity-90 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50`}
            >
              {processing
                ? "Processing..."
                : job.archived
                  ? "📦 Unarchive"
                  : "📦 Archive"}
            </button>

            {!job.completed && (
              <button
                onClick={markEventComplete}
                disabled={processing}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
              >
                {processing ? "Processing..." : "✓ Mark Complete"}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">
              {applicants.length}/{job.helpers_needed * 2}
            </p>
            <p className="text-blue-600 font-semibold">Total Applications</p>
          </div>
          <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-yellow-700">
              {pendingApplicants.length}
            </p>
            <p className="text-yellow-600 font-semibold">Pending</p>
          </div>
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">
              {acceptedApplicants.length}
            </p>
            <p className="text-green-600 font-semibold">Accepted</p>
          </div>
          <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">
              {rejectedApplicants.length}
            </p>
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
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ⏳ Pending Applications
                </h2>
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
                          <h3 className="font-bold text-gray-800">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted */}
            {acceptedApplicants.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ✓ Accepted Applications
                </h2>
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
                          <h3 className="font-bold text-gray-800">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected */}
            {rejectedApplicants.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  ✗ Rejected Applications
                </h2>
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
                          <h3 className="font-bold text-gray-800">
                            {app.name}
                          </h3>
                          <p className="text-sm text-gray-600">{app.city}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">📱 {app.phone}</p>
                      <p className="text-sm text-gray-600">
                        Applied: {new Date(app.applied_at).toLocaleDateString()}
                      </p>
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
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDialog(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Photo */}
            <div className="flex items-start gap-6 mb-6">
              {/* Profile Photo */}
              {seekerStats?.seekerInfo?.profile_photo ? (
                <img
                  src={seekerStats.seekerInfo.profile_photo}
                  alt={selectedApplicant.name}
                  onClick={() => {
                    setSelectedPhoto(seekerStats.seekerInfo!.profile_photo);
                    setShowPhotoModal(true);
                  }}
                  className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200 shadow-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                  {getInitials(selectedApplicant.name)}
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedApplicant.name}
                </h2>
                <span
                  className={`${getStatusBadge(selectedApplicant.status)} px-4 py-2 rounded-full font-semibold text-sm shadow-lg inline-block`}
                >
                  {selectedApplicant.status.charAt(0).toUpperCase() +
                    selectedApplicant.status.slice(1)}
                </span>

                {/* Stats */}
                {seekerStats && (
                  <div className="flex gap-3 mt-3">
                    <span className="text-sm flex items-center gap-1">
                      ⭐{" "}
                      <span className="font-semibold">
                        {Number(getSeekerStatsDisplay().avgRating) > 0
                          ? getSeekerStatsDisplay().avgRating
                          : "No ratings"}
                      </span>
                    </span>
                    <span
                      className={`text-sm flex items-center gap-1 ${getSeekerStatsDisplay().redFlagCount > 0 ? "text-red-600 font-semibold" : ""}`}
                    >
                      🚩{" "}
                      <span>
                        {getSeekerStatsDisplay().redFlagCount} Red Flags
                      </span>
                    </span>
                    {getSeekerStatsDisplay().isBanned && (
                      <span className="text-red-600 font-bold text-sm">
                        🚫 BANNED
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ✅ ID PROOF SECTION - ADDED HERE */}
            {seekerStats?.seekerInfo?.id_proof_photo && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🆔 ID Proof Document
                </h3>
                <div className="bg-gray-50 rounded-2xl p-4 border-2 border-indigo-200">
                  <img
                    src={seekerStats.seekerInfo.id_proof_photo}
                    alt="ID Proof"
                    onClick={() => {
                      setSelectedPhoto(seekerStats.seekerInfo!.id_proof_photo);
                      setShowPhotoModal(true);
                    }}
                    className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <p className="text-indigo-600 text-sm font-semibold mt-2">
                    🔍 Click image to enlarge
                  </p>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">
                  📱 {selectedApplicant.phone}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Age</p>
                <p className="font-semibold text-gray-800">
                  {selectedApplicant.age} years
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">City</p>
                <p className="font-semibold text-gray-800">
                  📍 {selectedApplicant.city}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                <p className="font-semibold text-gray-800">
                  ⏰ {selectedApplicant.availability}
                </p>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-gray-800">{selectedApplicant.experience}</p>
            </div>

            {/* Applied Date */}
            <p className="text-sm text-gray-500 mb-6">
              Applied on:{" "}
              {new Date(selectedApplicant.applied_at).toLocaleDateString()}
            </p>

            {/* ✅ DISPLAY CUSTOM DATA */}
            {selectedApplicant.custom_data &&
              Object.keys(selectedApplicant.custom_data).length > 0 && (
                <div className="mb-6 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="text-purple-600">📋</span>
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    {/* Additional Photo */}
                    {selectedApplicant.custom_data.additional_photo && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
                        <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                          📸 Additional Photo
                        </h4>
                        <img
                          src={selectedApplicant.custom_data.additional_photo}
                          alt="Additional"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedApplicant.custom_data.additional_photo,
                            );
                            setShowPhotoModal(true);
                          }}
                          className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-purple-300 dark:border-purple-600"
                        />
                        <p className="text-purple-600 dark:text-purple-400 text-sm font-semibold mt-2">
                          🔍 Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* Additional ID Proof */}
                    {selectedApplicant.custom_data.additional_id_proof && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                          🆔 Additional ID Proof
                        </h4>
                        <img
                          src={
                            selectedApplicant.custom_data.additional_id_proof
                          }
                          alt="Additional ID"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedApplicant.custom_data.additional_id_proof,
                            );
                            setShowPhotoModal(true);
                          }}
                          className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-blue-300 dark:border-blue-600"
                        />
                        <p className="text-blue-600 dark:text-blue-400 text-sm font-semibold mt-2">
                          🔍 Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* Birthmark Photo */}
                    {selectedApplicant.custom_data.birthmark_photo && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700">
                        <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                          ⚫ Birthmark/Mole Photo
                        </h4>
                        <img
                          src={selectedApplicant.custom_data.birthmark_photo}
                          alt="Birthmark"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedApplicant.custom_data.birthmark_photo,
                            );
                            setShowPhotoModal(true);
                          }}
                          className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-orange-300 dark:border-orange-600"
                        />
                        <p className="text-orange-600 dark:text-orange-400 text-sm font-semibold mt-2">
                          🔍 Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* Formal Photo */}
                    {selectedApplicant.custom_data.formal_photo && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                          👔 Photo in Formals
                        </h4>
                        <img
                          src={selectedApplicant.custom_data.formal_photo}
                          alt="Formal"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedApplicant.custom_data.formal_photo,
                            );
                            setShowPhotoModal(true);
                          }}
                          className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-indigo-300 dark:border-indigo-600"
                        />
                        <p className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold mt-2">
                          🔍 Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* Profile Photo */}
                    {selectedApplicant.custom_data.profile_photo && (
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 border-2 border-pink-200 dark:border-pink-700">
                        <h4 className="font-bold text-pink-800 dark:text-pink-300 mb-2 flex items-center gap-2">
                          📷 Left/Right Face Profile
                        </h4>
                        <img
                          src={selectedApplicant.custom_data.profile_photo}
                          alt="Profile"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedApplicant.custom_data.profile_photo,
                            );
                            setShowPhotoModal(true);
                          }}
                          className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity border-2 border-pink-300 dark:border-pink-600"
                        />
                        <p className="text-pink-600 dark:text-pink-400 text-sm font-semibold mt-2">
                          🔍 Click to enlarge
                        </p>
                      </div>
                    )}

                    {/* College Name */}
                    {selectedApplicant.custom_data.college_name && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-700">
                        <h4 className="font-bold text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
                          🎓 College Name
                        </h4>
                        <p className="text-green-700 dark:text-green-400 text-lg">
                          {selectedApplicant.custom_data.college_name}
                        </p>
                      </div>
                    )}

                    {/* Highest Qualification */}
                    {selectedApplicant.custom_data.highest_qualification && (
                      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-4 border-2 border-teal-200 dark:border-teal-700">
                        <h4 className="font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-2">
                          📚 Highest Qualification
                        </h4>
                        <p className="text-teal-700 dark:text-teal-400 text-lg">
                          {selectedApplicant.custom_data.highest_qualification}
                        </p>
                      </div>
                    )}

                    {/* English Fluency */}
                    {selectedApplicant.custom_data.english_fluency && (
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 border-2 border-cyan-200 dark:border-cyan-700">
                        <h4 className="font-bold text-cyan-800 dark:text-cyan-300 mb-1 flex items-center gap-2">
                          🗣️ English Fluency
                        </h4>
                        <p className="text-cyan-700 dark:text-cyan-400 text-lg">
                          {selectedApplicant.custom_data.english_fluency}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {selectedApplicant.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus("accepted")}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => updateStatus("rejected")}
                    disabled={processing}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "✗ Reject"}
                  </button>
                </div>
              )}

              {selectedApplicant.status === "accepted" && !job.completed && (
                <button
                  onClick={async () => {
                    if (
                      !confirm(
                        "Cancel this approval? Candidate will be moved back to pending.",
                      )
                    )
                      return;

                    setProcessing(true);
                    try {
                      const data = await apiCall(
                        `/applications/${selectedApplicant.id}/cancel-approval`,
                        {
                          method: "POST",
                        },
                      );

                      if (data.success) {
                        alert("✅ Approval canceled!");
                        setShowDialog(false);
                        await loadData();
                      }
                    } catch (error: any) {
                      alert(error.message || "Failed to cancel approval");
                    } finally {
                      setProcessing(false);
                    }
                  }}
                  disabled={processing}
                  className="w-full bg-gradient-to-r from-orange-500 to-yellow-600 text-white py-3 rounded-2xl hover:from-orange-600 hover:to-yellow-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                >
                  {processing ? "Processing..." : "↩️ Cancel Approval"}
                </button>
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
              For:{" "}
              <span className="font-semibold">{selectedApplicant.name}</span>
            </p>
            <textarea
              placeholder="Reason for red flag (e.g., Did not show up to event)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              disabled={processing}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowFlagModal(false);
                  setFlagReason("");
                }}
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRedFlag}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg disabled:opacity-50"
              >
                {processing ? "Adding..." : "Add Flag"}
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
              For:{" "}
              <span className="font-semibold">{selectedApplicant.name}</span>
            </p>

            {/* Star Rating */}
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  disabled={processing}
                  className={`text-5xl transition-all ${
                    star <= rating
                      ? "text-yellow-500 scale-110"
                      : "text-gray-300"
                  } ${processing ? "opacity-50" : ""}`}
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
                disabled={processing}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRating}
                disabled={processing}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-2xl hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold shadow-lg disabled:opacity-50"
              >
                {processing ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Enlarge Modal */}
      {showPhotoModal && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[70] p-4"
          onClick={() => setShowPhotoModal(false)}
        >
          <div className="relative max-w-6xl max-h-[90vh]">
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-12 right-0 text-white bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-semibold"
            >
              ✕ Close
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </main>
  );
}
