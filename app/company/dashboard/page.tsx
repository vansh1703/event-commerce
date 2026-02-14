"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import { apiCall } from "@/lib/api";
import * as XLSX from "xlsx";
import CompanyFooter from "@/components/CompanyFooter";

type JobRequest = {
  id: string;
  company_id: string;
  company_name: string;
  company_email: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  event_date: string;
  event_time: string;
  payment_offered: string;
  description: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  rejection_reason?: string;
  approved_job_id?: string;
};

type Job = {
  id: string;
  request_id: string;
  company_id: string;
  company_name: string;
  company_email: string;
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
  redFlags: Array<{ date: string; reason: string; job_title: string }>;
  redFlagCount: number;
  isBanned: boolean;
  bannedUntil: string | null;
};

const ACTIVE_JOBS_PER_PAGE = 5;

export default function CompanyDashboard() {
  const router = useRouter();
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<JobRequest[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState<Application | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [seekerStats, setSeekerStats] = useState<SeekerStats | null>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryJob, setSelectedHistoryJob] = useState<Job | null>(
    null,
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [activeJobsPage, setActiveJobsPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    console.log("Dashboard checking auth, found user:", user);

    if (!user) {
      console.log("No user found, redirecting to login");
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    console.log("Parsed user:", parsedUser);

    if (parsedUser.user_type === "superadmin") {
      console.log("SuperAdmin detected, redirecting");
      router.push("/superadmin/dashboard");
      return;
    }

    if (parsedUser.user_type !== "company") {
      console.log("Not a company user, redirecting to login");
      router.push("/auth/login");
      return;
    }

    console.log("Auth check passed, loading data for:", parsedUser.id);
    setCompanyUser(parsedUser);
    await loadData(parsedUser.id);
  };

  const loadData = async (companyId: string) => {
    try {
      // Load job requests
      const requestsData = await apiCall("/job-requests", { method: "GET" });
      if (requestsData.success) {
        const myReqs = requestsData.jobRequests.filter(
          (req: JobRequest) => req.company_id === companyId,
        );
        setMyRequests(myReqs);
      }

      // Load jobs
      const jobsData = await apiCall("/jobs", { method: "GET" });
      if (jobsData.success) {
        const myJobs = jobsData.jobs.filter(
          (job: Job) => job.company_id === companyId,
        );

        const active = myJobs.filter(
          (job: Job) =>
            !job.completed && new Date(job.event_end_date) >= new Date(),
        );
        const completed = myJobs.filter(
          (job: Job) =>
            job.completed || new Date(job.event_end_date) < new Date(),
        );

        setApprovedJobs(active);
        setCompletedJobs(completed);
      }

      // Load applications
      const appsData = await apiCall("/applications", { method: "GET" });
      if (appsData.success) {
        setApplications(appsData.applications);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const openHistoryJobModal = (job: Job) => {
    setSelectedHistoryJob(job);
    setShowHistoryModal(true);
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

  const exportCandidates = async (jobId: string, jobTitle: string) => {
    const acceptedCandidates = applications.filter(
      (app) => app.job_id === jobId && app.status === "accepted",
    );

    if (acceptedCandidates.length === 0) {
      alert("No accepted candidates to export for this job!");
      return;
    }

    // Fetch seeker stats for each candidate to get profile photo
    const exportDataPromises = acceptedCandidates.map(async (app) => {
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

    XLSX.writeFile(workbook, `${jobTitle}_Accepted_Candidates.xlsx`);
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

  const totalActiveJobsPages = Math.ceil(
    approvedJobs.length / ACTIVE_JOBS_PER_PAGE,
  );
  const activeJobsStartIndex = (activeJobsPage - 1) * ACTIVE_JOBS_PER_PAGE;
  const activeJobsEndIndex = activeJobsStartIndex + ACTIVE_JOBS_PER_PAGE;
  const currentActiveJobs = approvedJobs.slice(
    activeJobsStartIndex,
    activeJobsEndIndex,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const pendingRequests = myRequests.filter((req) => req.status === "pending");
  const rejectedRequests = myRequests.filter(
    (req) => req.status === "rejected",
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {companyUser?.company_name || "Company"} Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back! Manage your job postings and candidates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/company/submit-request")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
          >
            + Submit Job Request
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">
            {pendingRequests.length}
          </p>
          <p className="text-yellow-600 font-semibold">Pending Approval</p>
        </div>
        <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {approvedJobs.length}
          </p>
          <p className="text-green-600 font-semibold">Active Jobs</p>
        </div>
        <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700">
            {rejectedRequests.length}
          </p>
          <p className="text-red-600 font-semibold">Rejected Requests</p>
        </div>
        <div
          className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-4 text-center transition-all"
          // onClick={() => router.push("/company/event-history")}
        >
          <p className="text-3xl font-bold text-purple-700">
            {completedJobs.length}
          </p>
          <p className="text-purple-600 font-semibold">Completed Events</p>
        </div>
      </div>

      {/* Event History Toggle */}
      {completedJobs.length > 0 && (
        <div className="max-w-6xl mx-auto mb-6">
          <button
            onClick={() => router.push("/company/event-history")}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg"
          >
            {showHistory ? "Hide" : "Show"} Event History (
            {completedJobs.length})
          </button>
        </div>
      )}

      {/* Event History Section */}
      

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ⏳ Pending Admin Approval ({pendingRequests.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl shadow-lg p-6 border-2 border-yellow-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {req.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {req.event_type} • {req.location}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                      PENDING
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      📅 {req.event_date} at {req.event_time}
                    </p>
                    <p>👥 {req.helpers_needed} helpers needed</p>
                    {/* <p>💰 Offered: {req.payment_offered}</p> */}
                    <p className="text-xs text-gray-500">
                      Submitted: {req.submitted_at}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              ✗ Rejected Requests ({rejectedRequests.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rejectedRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-3xl shadow-lg p-6 border-2 border-red-200 opacity-80"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {req.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {req.event_type} • {req.location}
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                      REJECTED
                    </span>
                  </div>
                  {req.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
                      <p className="text-sm text-red-800 font-semibold mb-1">
                        Rejection Reason:
                      </p>
                      <p className="text-sm text-red-700">
                        {req.rejection_reason}
                      </p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>
                      📅 {req.event_date} at {req.event_time}
                    </p>
                    {/* <p>💰 Offered: {req.payment_offered}</p> */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Jobs with Accepted Candidates */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🎯 Active Jobs & Accepted Candidates ({approvedJobs.length})
          </h2>

          {approvedJobs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                No approved jobs yet. Submit a job request to get started!
              </p>
              <button
                onClick={() => router.push("/company/submit-request")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
              >
                Submit Job Request
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {currentActiveJobs.map((job) => {
                  const jobApplicants = applications.filter(
                    (app) => app.job_id === job.id,
                  );
                  const acceptedCandidates = jobApplicants.filter(
                    (app) => app.status === "accepted",
                  );
                  const pendingCandidates = jobApplicants.filter(
                    (app) => app.status === "pending",
                  );

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-3xl shadow-xl p-6 border border-gray-400"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-800 mb-2">
                            {job.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {job.event_type} • {job.location} • 📅{" "}
                            {job.event_start_date === job.event_end_date
                              ? `${job.event_start_date} at ${job.event_start_time}`
                              : `${job.event_start_date} to ${job.event_end_date}, ${job.event_start_time} - ${job.event_end_time}`}
                          </p>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() =>
                              router.push(`/company/applicants/${job.id}`)
                            }
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
                          >
                            👥 View Applicants
                          </button>

                          {acceptedCandidates.length > 0 && (
                            <button
                              onClick={() =>
                                exportCandidates(job.id, job.title)
                              }
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
                            >
                              📊 Export Excel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 flex-wrap">
                        <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                          <span className="text-green-700 font-semibold text-sm">
                            ✓ {acceptedCandidates.length} Accepted
                          </span>
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-full">
                          <span className="text-yellow-700 font-semibold text-sm">
                            ⏳ {pendingCandidates.length} Pending Admin Review
                          </span>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-full">
                          <span className="text-blue-700 font-semibold text-sm">
                            📋 {jobApplicants.length} Total Applications
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ Pagination for Active Jobs */}
              {totalActiveJobsPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setActiveJobsPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={activeJobsPage === 1}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from(
                      { length: totalActiveJobsPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setActiveJobsPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          activeJobsPage === page
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setActiveJobsPage((prev) =>
                        Math.min(totalActiveJobsPages, prev + 1),
                      )
                    }
                    disabled={activeJobsPage === totalActiveJobsPages}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
              {/* Profile Photo */}
              {/* Profile Photo */}
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

                {/* Stats */}
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

            {/* ✅ ID PROOF SECTION - ADDED HERE */}
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

            {/* Red Flags (if any) */}
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

            {/* Ratings (if any) */}
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

      {/* Event History Detail Modal */}
      {showHistoryModal && selectedHistoryJob && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Event Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">
                    {selectedHistoryJob.title}
                  </h2>
                  <p className="text-gray-600">
                    {selectedHistoryJob.event_type} •{" "}
                    {selectedHistoryJob.location}
                  </p>
                  <p className="text-gray-600">
                    📅 {selectedHistoryJob.date} at {selectedHistoryJob.time}
                  </p>
                </div>
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  ✓ Completed
                </span>
              </div>

              {/* Export Button */}
              {applications.filter(
                (app) =>
                  app.job_id === selectedHistoryJob.id &&
                  app.status === "accepted",
              ).length > 0 && (
                <button
                  onClick={() =>
                    exportCandidates(
                      selectedHistoryJob.id,
                      selectedHistoryJob.title,
                    )
                  }
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2 mb-6"
                >
                  📊 Export to Excel
                </button>
              )}
            </div>

            {/* Event Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-2">
                Event Description:
              </h3>
              <p className="text-gray-700">{selectedHistoryJob.description}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>👥 Helpers Needed: {selectedHistoryJob.helpers_needed}</p>
                <p>📞 Contact: {selectedHistoryJob.contact_phone}</p>
              </div>
            </div>

            {/* Accepted Candidates Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Accepted Candidates (
                {
                  applications.filter(
                    (app) =>
                      app.job_id === selectedHistoryJob.id &&
                      app.status === "accepted",
                  ).length
                }
                )
              </h3>

              {applications.filter(
                (app) =>
                  app.job_id === selectedHistoryJob.id &&
                  app.status === "accepted",
              ).length === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <p className="text-gray-500">
                    No candidates were accepted for this event.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {applications
                    .filter(
                      (app) =>
                        app.job_id === selectedHistoryJob.id &&
                        app.status === "accepted",
                    )
                    .map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={() => openCandidateModal(candidate)}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 border-2 border-green-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {getInitials(candidate.name)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">
                              {candidate.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {candidate.city}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-gray-600 mb-3">
                          <p>📱 {candidate.phone}</p>
                          <p>🎂 {candidate.age} years</p>
                          <p>⏰ {candidate.availability}</p>
                        </div>

                        <p className="text-xs text-green-600 mt-2 font-semibold">
                          Click for full details →
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowHistoryModal(false)}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
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

      <CompanyFooter />
    </main>
  );
}
