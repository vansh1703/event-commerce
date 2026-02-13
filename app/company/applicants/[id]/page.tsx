"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import * as XLSX from "xlsx";

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  date: string;
  time: string;
  payment: string;
  description: string;
  helpers_needed: number;
  completed: boolean;
  company_id: string;
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
  ratings: Array<{ stars: number; job_title: string; date: string }>;
  redFlags: Array<{ reason: string; job_title: string; date: string }>;
  redFlagCount: number;
  isBanned: boolean;
  bannedUntil: string | null;
};

const ITEMS_PER_LOAD = 12;

export default function CompanyApplicantsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [acceptedApplicants, setAcceptedApplicants] = useState<Application[]>(
    [],
  );
  const [displayedApplicants, setDisplayedApplicants] = useState<Application[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Modal states
  const [selectedCandidate, setSelectedCandidate] =
    useState<Application | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [seekerStats, setSeekerStats] = useState<SeekerStats | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "company") {
      router.push("/auth/login");
      return;
    }

    await loadData(parsedUser.id);
  };

  const loadData = async (companyId: string) => {
    try {
      // Load job details
      const jobsData = await apiCall("/jobs", { method: "GET" });

      if (jobsData.success) {
        const foundJob = jobsData.jobs.find(
          (j: Job) => j.id === jobId && j.company_id === companyId,
        );

        if (!foundJob) {
          alert("Job not found or unauthorized!");
          router.push("/company/dashboard");
          return;
        }

        setJob(foundJob);
      }

      // Load ONLY ACCEPTED applicants
      const appsData = await apiCall(`/applications?jobId=${jobId}`, {
        method: "GET",
      });

      if (appsData.success) {
        // ✅ FILTER: Only show accepted candidates
        const accepted = appsData.applications.filter(
          (app: Application) => app.status === "accepted",
        );
        setAcceptedApplicants(accepted);

        // Load first batch
        setDisplayedApplicants(accepted.slice(0, ITEMS_PER_LOAD));
        setHasMore(accepted.length > ITEMS_PER_LOAD);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    setLoadingMore(true);

    setTimeout(() => {
      const currentLength = displayedApplicants.length;
      const nextBatch = acceptedApplicants.slice(
        0,
        currentLength + ITEMS_PER_LOAD,
      );

      setDisplayedApplicants(nextBatch);
      setHasMore(nextBatch.length < acceptedApplicants.length);
      setLoadingMore(false);
    }, 300);
  };

  const openCandidateModal = async (candidate: Application) => {
    setSelectedCandidate(candidate);

    try {
      const data = await apiCall(`/seekers/${candidate.seeker_id}/stats`, {
        method: "GET",
      });

      if (data.success) {
        setSeekerStats(data.stats);
      }
    } catch (error) {
      console.error("Error loading seeker stats:", error);
    }

    setShowCandidateModal(true);
  };

  const exportCandidates = async () => {
    if (acceptedApplicants.length === 0) {
      alert("No accepted candidates to export!");
      return;
    }

    const exportDataPromises = acceptedApplicants.map(async (app) => {
      try {
        const statsRes = await fetch(`/api/seekers/${app.seeker_id}/stats`);
        const statsData = await statsRes.json();

        return {
          Name: app.name,
          Phone: app.phone,
          Age: app.age,
          City: app.city,
          Availability: app.availability,
          Experience: app.experience,
          "Applied On": new Date(app.applied_at).toLocaleDateString(),
          Status: "Accepted",
          "Profile Photo URL":
            statsData.success && statsData.stats.seekerInfo?.profile_photo
              ? statsData.stats.seekerInfo.profile_photo
              : "Not available",
          "ID Proof URL":
            statsData.success && statsData.stats.seekerInfo?.id_proof_photo
              ? statsData.stats.seekerInfo.id_proof_photo
              : "Not available",
        };
      } catch (error) {
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

    const exportData = await Promise.all(exportDataPromises);

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accepted Candidates");

    XLSX.writeFile(workbook, `${job?.title}_Accepted_Candidates.xlsx`);
    alert("✅ Candidate list exported successfully with photo URLs!");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading candidates...</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button
              onClick={() => router.push("/company/dashboard")}
              className="text-indigo-600 hover:text-purple-600 font-semibold mb-2 flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {job.title} - Accepted Candidates
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {job.event_type} • {job.location} • 📅{" "}
              {job.event_start_date === job.event_end_date
                ? job.event_start_date
                : `${job.event_start_date} to ${job.event_end_date}`}
            </p>
          </div>

          {acceptedApplicants.length > 0 && (
            <button
              onClick={exportCandidates}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              📊 Export Excel
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">
              {acceptedApplicants.length}
            </p>
            <p className="text-green-600 font-semibold">Accepted Candidates</p>
          </div>
          <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">
              {job.helpers_needed}
            </p>
            <p className="text-blue-600 font-semibold">Helpers Needed</p>
          </div>
        </div>

        {/* Applicants Grid */}
        {displayedApplicants.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
            <p className="text-gray-500 mb-2">No accepted candidates yet.</p>
            <p className="text-sm text-gray-400">
              SuperAdmin is reviewing applications.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {displayedApplicants.map((app) => (
                <div
                  key={app.id}
                  onClick={() => openCandidateModal(app)}
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
                  <p className="text-sm text-gray-600">🎂 {app.age} years</p>
                  <p className="text-sm text-gray-600">⏰ {app.availability}</p>
                  <div className="mt-3">
                    <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Accepted by Admin
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
                >
                  {loadingMore ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </span>
                  ) : (
                    `Load More (${acceptedApplicants.length - displayedApplicants.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Candidate Detail Modal */}
      {showCandidateModal && selectedCandidate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCandidateModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Photo */}
            <div className="flex items-start gap-6 mb-6">
              {seekerStats?.seekerInfo?.profile_photo ? (
                <img
                  src={seekerStats.seekerInfo.profile_photo}
                  alt={selectedCandidate.name}
                  onClick={() => {
                    setSelectedPhoto(seekerStats.seekerInfo!.profile_photo);
                    setShowPhotoModal(true);
                  }}
                  className="w-24 h-24 rounded-full object-cover border-4 border-green-200 shadow-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                  {getInitials(selectedCandidate.name)}
                </div>
              )}

              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedCandidate.name}
                </h2>
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg inline-block">
                  ✓ Accepted by Admin
                </span>

                {seekerStats && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="text-sm flex items-center gap-1">
                      ⭐{" "}
                      <span className="font-semibold">
                        {Number(seekerStats.avgRating) > 0
                          ? seekerStats.avgRating
                          : "No ratings"}
                      </span>
                    </span>
                    <span
                      className={`text-sm flex items-center gap-1 ${
                        seekerStats.redFlagCount > 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      🚩 <span>{seekerStats.redFlagCount} Red Flags</span>
                    </span>
                    {seekerStats.isBanned && (
                      <span className="text-red-600 font-bold text-sm">
                        🚫 BANNED
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ID Proof Section */}
            {seekerStats?.seekerInfo?.id_proof_photo && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  🆔 ID Proof Document
                </h3>
                <div className="bg-gray-50 rounded-2xl p-4 border-2 border-green-200">
                  <img
                    src={seekerStats.seekerInfo.id_proof_photo}
                    alt="ID Proof"
                    onClick={() => {
                      setSelectedPhoto(seekerStats.seekerInfo!.id_proof_photo);
                      setShowPhotoModal(true);
                    }}
                    className="w-full max-h-96 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  />
                  <p className="text-green-600 text-sm font-semibold mt-2">
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
                  📱 {selectedCandidate.phone}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Age</p>
                <p className="font-semibold text-gray-800">
                  {selectedCandidate.age} years
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">City</p>
                <p className="font-semibold text-gray-800">
                  📍 {selectedCandidate.city}
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                <p className="font-semibold text-gray-800">
                  ⏰ {selectedCandidate.availability}
                </p>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-gray-800">{selectedCandidate.experience}</p>
            </div>

            {/* Applied Date */}
            <p className="text-sm text-gray-500 mb-6">
              Applied on:{" "}
              {new Date(selectedCandidate.applied_at).toLocaleDateString()}
            </p>

            {/* ✅ DISPLAY CUSTOM DATA */}
            {selectedCandidate.custom_data &&
              Object.keys(selectedCandidate.custom_data).length > 0 && (
                <div className="mb-6 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <span className="text-purple-600">📋</span>
                    Additional Information
                  </h3>

                  <div className="space-y-4">
                    {/* Additional Photo */}
                    {selectedCandidate.custom_data.additional_photo && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
                        <h4 className="font-bold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
                          📸 Additional Photo
                        </h4>
                        <img
                          src={selectedCandidate.custom_data.additional_photo}
                          alt="Additional"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedCandidate.custom_data.additional_photo,
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
                    {selectedCandidate.custom_data.additional_id_proof && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                        <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                          🆔 Additional ID Proof
                        </h4>
                        <img
                          src={
                            selectedCandidate.custom_data.additional_id_proof
                          }
                          alt="Additional ID"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedCandidate.custom_data.additional_id_proof,
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
                    {selectedCandidate.custom_data.birthmark_photo && (
                      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-4 border-2 border-orange-200 dark:border-orange-700">
                        <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
                          ⚫ Birthmark/Mole Photo
                        </h4>
                        <img
                          src={selectedCandidate.custom_data.birthmark_photo}
                          alt="Birthmark"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedCandidate.custom_data.birthmark_photo,
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
                    {selectedCandidate.custom_data.formal_photo && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 border-2 border-indigo-200 dark:border-indigo-700">
                        <h4 className="font-bold text-indigo-800 dark:text-indigo-300 mb-2 flex items-center gap-2">
                          👔 Photo in Formals
                        </h4>
                        <img
                          src={selectedCandidate.custom_data.formal_photo}
                          alt="Formal"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedCandidate.custom_data.formal_photo,
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
                    {selectedCandidate.custom_data.profile_photo && (
                      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-2xl p-4 border-2 border-pink-200 dark:border-pink-700">
                        <h4 className="font-bold text-pink-800 dark:text-pink-300 mb-2 flex items-center gap-2">
                          📷 Left/Right Face Profile
                        </h4>
                        <img
                          src={selectedCandidate.custom_data.profile_photo}
                          alt="Profile"
                          onClick={() => {
                            setSelectedPhoto(
                              selectedCandidate.custom_data.profile_photo,
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
                    {selectedCandidate.custom_data.college_name && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-4 border-2 border-green-200 dark:border-green-700">
                        <h4 className="font-bold text-green-800 dark:text-green-300 mb-1 flex items-center gap-2">
                          🎓 College Name
                        </h4>
                        <p className="text-green-700 dark:text-green-400 text-lg">
                          {selectedCandidate.custom_data.college_name}
                        </p>
                      </div>
                    )}

                    {/* Highest Qualification */}
                    {selectedCandidate.custom_data.highest_qualification && (
                      <div className="bg-teal-50 dark:bg-teal-900/20 rounded-2xl p-4 border-2 border-teal-200 dark:border-teal-700">
                        <h4 className="font-bold text-teal-800 dark:text-teal-300 mb-1 flex items-center gap-2">
                          📚 Highest Qualification
                        </h4>
                        <p className="text-teal-700 dark:text-teal-400 text-lg">
                          {selectedCandidate.custom_data.highest_qualification}
                        </p>
                      </div>
                    )}

                    {/* English Fluency */}
                    {selectedCandidate.custom_data.english_fluency && (
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-2xl p-4 border-2 border-cyan-200 dark:border-cyan-700">
                        <h4 className="font-bold text-cyan-800 dark:text-cyan-300 mb-1 flex items-center gap-2">
                          🗣️ English Fluency
                        </h4>
                        <p className="text-cyan-700 dark:text-cyan-400 text-lg">
                          {selectedCandidate.custom_data.english_fluency}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Red Flags */}
            {seekerStats &&
              seekerStats.redFlags &&
              seekerStats.redFlags.length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
                  <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    🚩 Red Flags ({seekerStats.redFlags.length})
                  </h3>
                  <div className="space-y-2">
                    {seekerStats.redFlags.map((flag, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-3 border border-red-200"
                      >
                        <p className="text-sm font-semibold text-red-700">
                          {flag.job_title}
                        </p>
                        <p className="text-sm text-red-600">{flag.reason}</p>
                        <p className="text-xs text-red-500 mt-1">{flag.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Ratings */}
            {seekerStats &&
              seekerStats.ratings &&
              seekerStats.ratings.length > 0 && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                  <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                    ⭐ Previous Ratings ({seekerStats.ratings.length})
                  </h3>
                  <div className="space-y-2">
                    {seekerStats.ratings.map((rating, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-3 border border-yellow-200"
                      >
                        <p className="text-sm font-semibold text-yellow-700">
                          {rating.job_title}
                        </p>
                        <p className="text-sm text-yellow-600">
                          {"⭐".repeat(rating.stars)} ({rating.stars}/5)
                        </p>
                        <p className="text-xs text-yellow-500 mt-1">
                          {rating.date}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            <button
              onClick={() => setShowCandidateModal(false)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
            >
              Close
            </button>
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
