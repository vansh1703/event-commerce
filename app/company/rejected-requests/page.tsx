"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import CompanyFooter from "@/components/CompanyFooter";
import { apiCall } from "@/lib/api";

type JobRequest = {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
  payment_offered: string;
  description: string;
  contact_phone: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  rejection_reason?: string;
};

const REQUESTS_PER_PAGE = 10;

export default function RejectedRequestsPage() {
  const router = useRouter();
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [rejectedRequests, setRejectedRequests] = useState<JobRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<JobRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, eventTypeFilter, rejectedRequests]);

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
      const requestsData = await apiCall("/job-requests", { method: "GET" });
      if (requestsData.success) {
        const rejected = requestsData.jobRequests.filter(
          (req: JobRequest) => req.company_id === companyId && req.status === "rejected"
        );
        setRejectedRequests(rejected);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = [...rejectedRequests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event type filter
    if (eventTypeFilter !== "all") {
      filtered = filtered.filter((req) => req.event_type === eventTypeFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const getEventTypes = () => {
    const types = new Set(rejectedRequests.map((req) => req.event_type));
    return Array.from(types);
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / REQUESTS_PER_PAGE);
  const startIndex = (currentPage - 1) * REQUESTS_PER_PAGE;
  const endIndex = startIndex + REQUESTS_PER_PAGE;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading rejected requests...</p>
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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                ✗ Rejected Requests
              </h1>
              <p className="text-gray-600 mt-2">
                Total: {rejectedRequests.length} rejected requests
              </p>
            </div>

            <LogoutButton />
          </div>

          {/* Search & Filter Section */}
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🔍 Search & Filter</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Title, Location, or Description
                </label>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-800"
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
                  className="w-full border-2 border-gray-200 p-3 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-red-400 text-gray-800"
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
              Showing {filteredRequests.length} of {rejectedRequests.length} requests
            </div>
          </div>

          {/* Rejected Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                {searchTerm || eventTypeFilter !== "all"
                  ? "No rejected requests match your filters."
                  : "No rejected requests yet."}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-3xl shadow-lg p-6 border-2 border-red-200 hover:shadow-xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{req.title}</h3>
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
                        <p className="text-sm text-red-700">{req.rejection_reason}</p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        📅{" "}
                        {req.event_start_date === req.event_end_date
                          ? `${req.event_start_date} at ${req.event_start_time}`
                          : `${req.event_start_date} to ${req.event_end_date}`}
                      </p>
                      <p>👥 {req.helpers_needed} helpers needed</p>
                      <p className="text-xs text-gray-500">Submitted: {req.submitted_at}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    ← Previous
                  </button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-semibold transition-all ${
                          currentPage === page
                            ? "bg-red-600 text-white"
                            : "bg-white text-gray-600 border-2 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white rounded-xl border-2 border-red-200 text-red-600 font-semibold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CompanyFooter />
    </main>
  );
}