"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import Dialog from "@/components/ui/Dialog";
import { useDialog } from "@/hooks/useDialog";

type JobRequest = {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  event_date: string;
  event_time: string;
  payment_offered: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  rejection_reason?: string;
  approved_job_id?: string;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
};

type Job = {
  id: string;
  title: string;
  company_name: string;
  event_start_date: string;
  event_end_date: string;
  completed: boolean;
};

type Application = {
  id: string;
  job_id: string;
  seeker_id: string;
  name: string;
  phone: string;
  city: string;
  status: "pending" | "accepted" | "rejected";
  applied_at: string;
};

type Rating = {
  id: string;
  seeker_id: string;
  job_id: string;
  stars: number;
};

type RedFlag = {
  id: string;
  seeker_id: string;
  job_id: string;
  reason: string;
};

const ITEMS_PER_PAGE = 10;

export default function AllRequestsPage() {
  const router = useRouter();
  const dialog = useDialog();
  
  const [allRequests, setAllRequests] = useState<JobRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JobRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // ✅ NEW: Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState<Job | null>(null);
  const [acceptedCandidates, setAcceptedCandidates] = useState<Application[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [redFlags, setRedFlags] = useState<RedFlag[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // ✅ NEW: Rating/Red Flag Form States
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [showRedFlagForm, setShowRedFlagForm] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [redFlagReason, setRedFlagReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [statusFilter, searchQuery, dateFilter, allRequests]);

  const loadRequests = async () => {
    try {
      const data = await apiCall("/job-requests", { method: "GET" });

      if (data.success) {
        // Sort by submitted date (newest first)
        const sorted = data.jobRequests.sort(
          (a: JobRequest, b: JobRequest) =>
            new Date(b.submitted_at).getTime() -
            new Date(a.submitted_at).getTime(),
        );
        setAllRequests(sorted);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...allRequests];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    // Filter by search query (event name/title)
    if (searchQuery.trim()) {
      filtered = filtered.filter((req) =>
        req.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by event start date
    if (dateFilter) {
      filtered = filtered.filter((req) => req.event_start_date === dateFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery("");
    setDateFilter("");
  };

  // ✅ NEW: Open Review Modal for Completed Job
  const openReviewModal = async (request: JobRequest) => {
    if (!request.approved_job_id) {
      dialog.showWarning(
        "No Job Found",
        "This request doesn't have an associated job."
      );
      return;
    }

    setLoadingCandidates(true);
    setShowReviewModal(true);

    try {
      // Fetch job details
      const jobsData = await apiCall("/jobs", { method: "GET" });
      const job = jobsData.jobs.find((j: Job) => j.id === request.approved_job_id);
      
      if (!job) {
        throw new Error("Job not found");
      }

      setSelectedJobForReview(job);

      // Fetch accepted candidates for this job
      const appsData = await apiCall(`/applications?jobId=${request.approved_job_id}`, {
        method: "GET",
      });

      const accepted = appsData.applications.filter(
        (app: Application) => app.status === "accepted"
      );
      setAcceptedCandidates(accepted);

      // Fetch existing ratings for this job
      const ratingsData = await apiCall(`/ratings?jobId=${request.approved_job_id}`, {
        method: "GET",
      });
      setRatings(ratingsData.ratings || []);

      // Fetch existing red flags for this job
      const flagsData = await apiCall(`/red-flags?jobId=${request.approved_job_id}`, {
        method: "GET",
      });
      setRedFlags(flagsData.redFlags || []);

    } catch (error: any) {
      console.error("Error loading candidates:", error);
      dialog.showError(
        "Error",
        "Failed to load candidates. Please try again."
      );
      setShowReviewModal(false);
    } finally {
      setLoadingCandidates(false);
    }
  };

  // ✅ NEW: Check if candidate has been rated
  const getCandidateRating = (seekerId: string) => {
    return ratings.find((r) => r.seeker_id === seekerId);
  };

  // ✅ NEW: Check if candidate has red flag
  const getCandidateRedFlag = (seekerId: string) => {
    return redFlags.find((f) => f.seeker_id === seekerId);
  };

  // ✅ NEW: Count reviewed candidates
  const getReviewedCount = () => {
    const reviewedSeekerIds = new Set([
      ...ratings.map((r) => r.seeker_id),
      ...redFlags.map((f) => f.seeker_id),
    ]);
    return reviewedSeekerIds.size;
  };

  // ✅ NEW: Submit Rating
  const handleSubmitRating = async () => {
    if (!selectedCandidate || !selectedJobForReview) return;

    setSubmitting(true);

    try {
      const data = await apiCall("/ratings", {
        method: "POST",
        body: JSON.stringify({
          seekerId: selectedCandidate.seeker_id,
          jobId: selectedJobForReview.id,
          jobTitle: selectedJobForReview.title,
          stars: ratingStars,
        }),
      });

      if (data.success) {
        dialog.showSuccess(
          "Rating Submitted",
          `You gave ${selectedCandidate.name} ${ratingStars} stars!`
        );
        
        // Refresh ratings
        const ratingsData = await apiCall(`/ratings?jobId=${selectedJobForReview.id}`, {
          method: "GET",
        });
        setRatings(ratingsData.ratings || []);
        
        setShowRatingForm(false);
        setSelectedCandidate(null);
        setRatingStars(5);
      }
    } catch (error: any) {
      dialog.showError(
        "Submission Failed",
        error.message || "Failed to submit rating. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ NEW: Submit Red Flag
  const handleSubmitRedFlag = async () => {
    if (!selectedCandidate || !selectedJobForReview || !redFlagReason.trim()) {
      dialog.showWarning(
        "Missing Information",
        "Please provide a reason for the red flag."
      );
      return;
    }

    setSubmitting(true);

    try {
      const data = await apiCall("/red-flags", {
        method: "POST",
        body: JSON.stringify({
          seekerId: selectedCandidate.seeker_id,
          jobId: selectedJobForReview.id,
          jobTitle: selectedJobForReview.title,
          reason: redFlagReason,
        }),
      });

      if (data.success) {
        dialog.showWarning(
          "Red Flag Added",
          `Red flag added for ${selectedCandidate.name}. They will be monitored.`
        );
        
        // Refresh red flags
        const flagsData = await apiCall(`/red-flags?jobId=${selectedJobForReview.id}`, {
          method: "GET",
        });
        setRedFlags(flagsData.redFlags || []);
        
        setShowRedFlagForm(false);
        setSelectedCandidate(null);
        setRedFlagReason("");
      }
    } catch (error: any) {
      dialog.showError(
        "Submission Failed",
        error.message || "Failed to submit red flag. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white";
      case "rejected":
        return "bg-red-500 text-white";
      default:
        return "bg-yellow-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return "✓";
      case "rejected":
        return "✗";
      default:
        return "⏳";
    }
  };

  const getFilteredCount = (status: string) => {
    let filtered = allRequests;

    if (status !== "all") {
      filtered = filtered.filter((r) => r.status === status);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((r) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateFilter) {
      filtered = filtered.filter((r) => r.event_start_date === dateFilter);
    }

    return filtered.length;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                All Job Requests History
              </h1>
              <p className="text-gray-600 mt-2">
                Total: {allRequests.length} requests
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔍 Search & Filter Requests
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Search by Event Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Event Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Wedding Event"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Filter by Event Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Event Start Date
                </label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                />
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-indigo-600">{filteredRequests.length}</span> requests
              {(searchQuery || dateFilter) && (
                <span className="ml-2 text-purple-600">(filtered)</span>
              )}
            </div>
          </div>

          {/* Status Filter Buttons */}
          <div className="bg-white rounded-2xl shadow-lg p-4 mb-6 border border-gray-100">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  statusFilter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All ({getFilteredCount("all")})
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  statusFilter === "pending"
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Pending ({getFilteredCount("pending")})
              </button>
              <button
                onClick={() => setStatusFilter("approved")}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  statusFilter === "approved"
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Approved ({getFilteredCount("approved")})
              </button>
              <button
                onClick={() => setStatusFilter("rejected")}
                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                  statusFilter === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Rejected ({getFilteredCount("rejected")})
              </button>
            </div>
          </div>

          {/* Requests List */}
          {currentRequests.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center border border-gray-100">
              <p className="text-gray-500 mb-4">
                {(searchQuery || dateFilter)
                  ? "No requests match your filters."
                  : "No requests found."}
              </p>
              {(searchQuery || dateFilter) && (
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {currentRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-gray-800">
                          {request.title}
                        </h3>
                        <span
                          className={`${getStatusBadge(request.status)} px-3 py-1 rounded-full text-xs font-semibold`}
                        >
                          {getStatusIcon(request.status)}{" "}
                          {request.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <p>🏢 Company: {request.company_name}</p>
                        <p>
                          📅 Date:{" "}
                          {request.event_start_date === request.event_end_date
                            ? request.event_start_date
                            : `${request.event_start_date} to ${request.event_end_date}`}
                        </p>
                        <p>📍 Location: {request.location}</p>
                        <p>👥 Helpers: {request.helpers_needed}</p>
                        <p>💰 Payment: {request.payment_offered}</p>
                        <p>🕐 Submitted: {request.submitted_at}</p>
                      </div>

                      {request.rejection_reason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-semibold text-red-800">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-600">
                            {request.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* ✅ NEW: Review Candidates Button for Approved Jobs */}
                      {request.status === "approved" && request.approved_job_id && (
                        <div className="mt-4">
                          <button
                            onClick={() => openReviewModal(request)}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-indigo-700 transition-all font-semibold shadow-lg flex items-center gap-2"
                          >
                            <span>⭐</span>
                            <span>Review Candidates</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                ← Previous
              </button>

              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                        currentPage === page
                          ? "bg-indigo-600 text-white"
                          : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ✅ NEW: Review Candidates Modal */}
      {showReviewModal && selectedJobForReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Review Candidates
                </h2>
                <p className="text-gray-600 mt-1">{selectedJobForReview.title}</p>
                <p className="text-sm text-gray-500">
                  {selectedJobForReview.company_name} • {selectedJobForReview.event_start_date}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedJobForReview(null);
                  setAcceptedCandidates([]);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Review Progress */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-purple-800">
                Reviewed: {getReviewedCount()} / {acceptedCandidates.length} candidates
              </p>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(getReviewedCount() / Math.max(acceptedCandidates.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {loadingCandidates ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading candidates...</p>
              </div>
            ) : acceptedCandidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No accepted candidates for this job.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {acceptedCandidates.map((candidate) => {
                  const rating = getCandidateRating(candidate.seeker_id);
                  const redFlag = getCandidateRedFlag(candidate.seeker_id);
                  const isReviewed = rating || redFlag;

                  return (
                    <div
                      key={candidate.id}
                      className={`border-2 rounded-2xl p-4 ${
                        isReviewed
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800 text-lg">
                            {candidate.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            📞 {candidate.phone} • 📍 {candidate.city}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Applied: {candidate.applied_at}
                          </p>

                          {/* Show existing rating */}
                          {rating && (
                            <div className="mt-2 bg-yellow-100 border border-yellow-300 rounded-lg p-2">
                              <p className="text-sm font-semibold text-yellow-800">
                                ⭐ Rated: {rating.stars} stars
                              </p>
                            </div>
                          )}

                          {/* Show existing red flag */}
                          {redFlag && (
                            <div className="mt-2 bg-red-100 border border-red-300 rounded-lg p-2">
                              <p className="text-sm font-semibold text-red-800">
                                🚩 Red Flag: {redFlag.reason}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        {!isReviewed && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowRatingForm(true);
                              }}
                              className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-xl hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold text-sm shadow-lg"
                            >
                              ⭐ Rate
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCandidate(candidate);
                                setShowRedFlagForm(true);
                              }}
                              className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold text-sm shadow-lg"
                            >
                              🚩 Flag
                            </button>
                          </div>
                        )}

                        {isReviewed && (
                          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6">
              <button
                onClick={() => {
                  setShowReviewModal(false);
                  setSelectedJobForReview(null);
                  setAcceptedCandidates([]);
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Rating Form Modal */}
      {showRatingForm && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Rate {selectedCandidate.name}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Rating (Stars)
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRatingStars(star)}
                    className={`text-4xl transition-all ${
                      star <= ratingStars
                        ? "text-yellow-500 scale-110"
                        : "text-gray-300"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <p className="text-center mt-2 text-gray-600 font-semibold">
                {ratingStars} Star{ratingStars !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRatingForm(false);
                  setSelectedCandidate(null);
                  setRatingStars(5);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRating}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-3 rounded-2xl hover:from-yellow-600 hover:to-orange-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Rating"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Red Flag Form Modal */}
      {showRedFlagForm && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Add Red Flag for {selectedCandidate.name}
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Red Flag
              </label>
              <textarea
                value={redFlagReason}
                onChange={(e) => setRedFlagReason(e.target.value)}
                placeholder="e.g., Did not show up, unprofessional behavior, etc."
                className="w-full border-2 border-gray-200 p-3 rounded-2xl min-h-[100px] bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-gray-800"
                disabled={submitting}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRedFlagForm(false);
                  setSelectedCandidate(null);
                  setRedFlagReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRedFlag}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Add Red Flag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={dialog.closeDialog}
        title={dialog.config.title}
        message={dialog.config.message}
        type={dialog.config.type}
        confirmText={dialog.config.confirmText}
        cancelText={dialog.config.cancelText}
        onConfirm={dialog.config.onConfirm}
        showCancel={dialog.config.showCancel}
      />
    </>
  );
}