"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import CompanyFooter from "@/components/CompanyFooter";
import { apiCall } from "@/lib/api";
import * as XLSX from "xlsx";

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

const EVENTS_PER_PAGE = 10;
const CANDIDATES_PER_PAGE = 9;

export default function EventHistoryPage() {
  const router = useRouter();
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHistoryJob, setSelectedHistoryJob] = useState<Job | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [seekerStats, setSeekerStats] = useState<SeekerStats | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string>("");

  // Pagination states
  const [eventsPage, setEventsPage] = useState(1);
  const [candidatesPage, setCandidatesPage] = useState(1);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [candidateSearchTerm, setCandidateSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [searchTerm, eventTypeFilter, completedJobs]);

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type === "superadmin") {
      router.push("/superadmin/dashboard");
      return;
    }

    if (parsedUser.user_type !== "company") {
      router.push("/auth/login");
      return;
    }

    setCompanyUser(parsedUser);
    await loadData(parsedUser.id);
  };

  const loadData = async (companyId: string) => {
    try {
      const jobsData = await apiCall("/jobs", { method: "GET" });
      if (jobsData.success) {
        const myJobs = jobsData.jobs.filter((job: Job) => job.company_id === companyId);
        const completed = myJobs.filter(
          (job: Job) => job.completed || new Date(job.event_end_date) < new Date()
        );
        setCompletedJobs(completed);
      }

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

  const filterJobs = () => {
    let filtered = [...completedJobs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.event_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((job) => job.event_type === eventTypeFilter);
    }

    setFilteredJobs(filtered);
    setEventsPage(1); // Reset to first page
  };

  const getEventTypes = () => {
    const types = new Set(completedJobs.map((job) => job.event_type));
    return Array.from(types);
  };

  const openHistoryJobModal = (job: Job) => {
    setSelectedHistoryJob(job);
    setShowHistoryModal(true);
    setCandidatesPage(1);
    setCandidateSearchTerm("");
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
      (app) => app.job_id === jobId && app.status === "accepted"
    );

    if (acceptedCandidates.length === 0) {
      alert("No accepted candidates to export for this job!");
      return;
    }

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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getModalCandidates = () => {
    if (!selectedHistoryJob) return { candidates: [], totalPages: 0, total: 0 };
    
    let candidates = applications.filter(
      (app) => app.job_id === selectedHistoryJob.id && app.status === "accepted"
    );

    // Apply search filter for candidates
    if (candidateSearchTerm) {
      candidates = candidates.filter(
        (app) =>
          app.name.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
          app.city.toLowerCase().includes(candidateSearchTerm.toLowerCase()) ||
          app.phone.includes(candidateSearchTerm)
      );
    }

    const totalPages = Math.ceil(candidates.length / CANDIDATES_PER_PAGE);
    const startIndex = (candidatesPage - 1) * CANDIDATES_PER_PAGE;
    const endIndex = startIndex + CANDIDATES_PER_PAGE;
    
    return {
      candidates: candidates.slice(startIndex, endIndex),
      totalPages,
      total: candidates.length,
      totalUnfiltered: applications.filter(
        (app) => app.job_id === selectedHistoryJob.id && app.status === "accepted"
      ).length,
    };
  };

  // Pagination for completed events
  const totalEventsPages = Math.ceil(filteredJobs.length / EVENTS_PER_PAGE);
  const eventsStartIndex = (eventsPage - 1) * EVENTS_PER_PAGE;
  const eventsEndIndex = eventsStartIndex + EVENTS_PER_PAGE;
  const currentEvents = filteredJobs.slice(eventsStartIndex, eventsEndIndex);

  const modalData = selectedHistoryJob ? getModalCandidates() : { candidates: [], totalPages: 0, total: 0, totalUnfiltered: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event history...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <button
                onClick={() => router.push("/company/dashboard")}
                className="text-indigo-600 hover:text-purple-600 font-semibold mb-2 flex items-center gap-2"
              >
                ← Back to Dashboard
              </button>
              <h1>📜</h1>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                 Event History
              </h1>
              <p className="text-gray-600 mt-2">
                Total: {completedJobs.length} completed events
              </p>
            </div>

            <LogoutButton />
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Search & Filter Events</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Title, Location, or Event Type
                </label>
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                />
              </div>

              {/* Event Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
                >
                  <option value="all">All Event Types</option>
                  {getEventTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredJobs.length} of {completedJobs.length} events
            </div>
          </div>

          {/* Completed Events List */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                {searchTerm || eventTypeFilter !== "all"
                  ? "No events match your filters."
                  : "No completed events yet."}
              </p>
              <button
                onClick={() => router.push("/company/dashboard")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentEvents.map((job) => {
                  const jobApplicants = applications.filter((app) => app.job_id === job.id);
                  const acceptedCount = jobApplicants.filter((app) => app.status === "accepted").length;

                  return (
                    <div
                      key={job.id}
                      onClick={() => openHistoryJobModal(job)}
                      className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-800 mb-1">{job.title}</h4>
                          <p className="text-sm text-gray-600">
                            {job.event_type} • {job.location}
                          </p>
                          <p className="text-sm text-gray-600">
                            📅 {job.event_start_date === job.event_end_date
                              ? job.event_start_date
                              : `${job.event_start_date} to ${job.event_end_date}`}
                          </p>
                          <p className="text-sm text-gray-600 mt-2">
                            ✓ {acceptedCount} accepted • {jobApplicants.length} total applicants
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                            ✓ Completed
                          </span>
                          <span className="text-gray-400 text-xl">→</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Events */}
              {totalEventsPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setEventsPage((prev) => Math.max(1, prev - 1))}
                    disabled={eventsPage === 1}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-purple-200 text-purple-600 font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalEventsPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setEventsPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          eventsPage === page
                            ? "bg-purple-600 text-white"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setEventsPage((prev) => Math.min(totalEventsPages, prev + 1))}
                    disabled={eventsPage === totalEventsPages}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-purple-200 text-purple-600 font-semibold hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Event History Detail Modal */}
      {showHistoryModal && selectedHistoryJob && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowHistoryModal(false);
            setCandidatesPage(1);
            setCandidateSearchTerm("");
          }}
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
                    {selectedHistoryJob.event_type} • {selectedHistoryJob.location}
                  </p>
                  <p className="text-gray-600">
                    📅 {selectedHistoryJob.event_start_date === selectedHistoryJob.event_end_date
                      ? `${selectedHistoryJob.event_start_date} at ${selectedHistoryJob.event_start_time}`
                      : `${selectedHistoryJob.event_start_date} to ${selectedHistoryJob.event_end_date}, ${selectedHistoryJob.event_start_time} - ${selectedHistoryJob.event_end_time}`}
                  </p>
                </div>
                <span className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg">
                  ✓ Completed
                </span>
              </div>

              {/* Export Button */}
              {Number(modalData.totalUnfiltered) > 0 && (
                <button
                  onClick={() => exportCandidates(selectedHistoryJob.id, selectedHistoryJob.title)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2 mb-6"
                >
                  📊 Export to Excel
                </button>
              )}
            </div>

            {/* Event Description */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-gray-800 mb-2">Event Description:</h3>
              <p className="text-gray-700">{selectedHistoryJob.description}</p>
              <div className="mt-3 space-y-1 text-sm text-gray-600">
                <p>👥 Helpers Needed: {selectedHistoryJob.helpers_needed}</p>
                <p>📞 Contact: {selectedHistoryJob.contact_phone}</p>
              </div>
            </div>

            {/* Accepted Candidates Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">
                  Accepted Candidates ({modalData.totalUnfiltered})
                </h3>
              </div>

              {/* Candidate Search */}
              {Number(modalData.totalUnfiltered) > 0 && (
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search candidates by name, city, or phone..."
                    value={candidateSearchTerm}
                    onChange={(e) => {
                      setCandidateSearchTerm(e.target.value);
                      setCandidatesPage(1);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Showing {modalData.total} of {modalData.totalUnfiltered} candidates
                  </p>
                </div>
              )}

              {modalData.total === 0 ? (
                <div className="bg-gray-50 rounded-2xl p-8 text-center">
                  <p className="text-gray-500">
                    {candidateSearchTerm
                      ? "No candidates match your search."
                      : "No candidates were accepted for this event."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {modalData.candidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openCandidateModal(candidate);
                        }}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-4 border-2 border-green-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                            {getInitials(candidate.name)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{candidate.name}</h3>
                            <p className="text-sm text-gray-600">{candidate.city}</p>
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

                  {/* Pagination for Candidates */}
                  {modalData.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mb-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidatesPage((prev) => Math.max(1, prev - 1));
                        }}
                        disabled={candidatesPage === 1}
                        className="px-3 py-2 bg-white rounded-xl border-2 border-green-200 text-green-600 font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                      >
                        ← Prev
                      </button>

                      <div className="flex gap-1">
                        {Array.from({ length: modalData.totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCandidatesPage(page);
                            }}
                            className={`w-8 h-8 rounded-lg font-semibold text-sm transition-all ${
                              candidatesPage === page
                                ? "bg-green-500 text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidatesPage((prev) => Math.min(modalData.totalPages, prev + 1));
                        }}
                        disabled={candidatesPage === modalData.totalPages}
                        className="px-3 py-2 bg-white rounded-xl border-2 border-green-200 text-green-600 font-semibold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <button
              onClick={() => {
                setShowHistoryModal(false);
                setCandidatesPage(1);
                setCandidateSearchTerm("");
              }}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal - KEEP THE SAME AS BEFORE */}
      {showCandidateModal && selectedCandidate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
          onClick={() => setShowCandidateModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Same candidate modal content as before - keeping it for brevity */}
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
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{selectedCandidate.name}</h2>
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg inline-block">
                  ✓ Accepted by Admin
                </span>

                {seekerStats && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="text-sm flex items-center gap-1">
                      ⭐{" "}
                      <span className="font-semibold">
                        {Number(seekerStats.avgRating) > 0 ? seekerStats.avgRating : "No ratings"}
                      </span>
                    </span>
                    <span className={`text-sm flex items-center gap-1 ${seekerStats.redFlagCount > 0 ? "text-red-600 font-semibold" : ""}`}>
                      🚩 <span>{seekerStats.redFlagCount} Red Flags</span>
                    </span>
                    {seekerStats.isBanned && (
                      <span className="text-red-600 font-bold text-sm">🚫 BANNED</span>
                    )}
                  </div>
                )}
              </div>
            </div>

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
                  <p className="text-green-600 text-sm font-semibold mt-2">🔍 Click image to enlarge</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Phone</p>
                <p className="font-semibold text-gray-800">📱 {selectedCandidate.phone}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Age</p>
                <p className="font-semibold text-gray-800">{selectedCandidate.age} years</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">City</p>
                <p className="font-semibold text-gray-800">📍 {selectedCandidate.city}</p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm text-gray-500 mb-1">Availability</p>
                <p className="font-semibold text-gray-800">⏰ {selectedCandidate.availability}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-gray-800">{selectedCandidate.experience}</p>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Applied on: {new Date(selectedCandidate.applied_at).toLocaleDateString()}
            </p>

            {seekerStats && seekerStats.redFlags && seekerStats.redFlags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  🚩 Red Flags ({seekerStats.redFlags.length})
                </h3>
                <div className="space-y-2">
                  {seekerStats.redFlags.map((flag, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-sm font-semibold text-red-700">{flag.job_title}</p>
                      <p className="text-sm text-red-600">{flag.reason}</p>
                      <p className="text-xs text-red-500 mt-1">{flag.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {seekerStats && seekerStats.ratings && seekerStats.ratings.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  ⭐ Previous Ratings ({seekerStats.ratings.length})
                </h3>
                <div className="space-y-2">
                  {seekerStats.ratings.map((rating, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-700">{rating.job_title}</p>
                      <p className="text-sm text-yellow-600">
                        {"⭐".repeat(rating.stars)} ({rating.stars}/5)
                      </p>
                      <p className="text-xs text-yellow-500 mt-1">{rating.date}</p>
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

      <CompanyFooter />
    </main>
  );
}