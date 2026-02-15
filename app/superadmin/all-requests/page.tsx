"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";

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
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
};

const ITEMS_PER_PAGE = 10;

export default function AllRequestsPage() {
  const router = useRouter();
  const [allRequests, setAllRequests] = useState<JobRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JobRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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
  );
}