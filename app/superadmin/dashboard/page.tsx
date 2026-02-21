"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import { apiCall } from "@/lib/api";
import SuperAdminSidebar from "@/components/SuperAdminSidebar";

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
  event_start_date: string;
  event_end_date: string;
};

type Job = {
  id: string;
  request_id: string;
  company_id: string;
  company_name: string;
  company_email: string;
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
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
};

type Application = {
  id: string;
  job_id: string;
  status: "pending" | "accepted" | "rejected";
};

const REQUESTS_PER_PAGE = 5;
const JOBS_PER_PAGE = 5;

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [allPendingRequests, setAllPendingRequests] = useState<JobRequest[]>(
    [],
  );
  const [filteredRequests, setFilteredRequests] = useState<JobRequest[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [allRequests, setAllRequests] = useState<JobRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(
    null,
  );
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Filters for Requests
  const [requestSearchQuery, setRequestSearchQuery] = useState("");
  const [requestDateFilter, setRequestDateFilter] = useState("");

  // Filters for Jobs
  const [jobSearchQuery, setJobSearchQuery] = useState("");
  const [jobDateFilter, setJobDateFilter] = useState("");

  // For posting job after approval
  const [finalTitle, setFinalTitle] = useState("");
  const [finalPayment, setFinalPayment] = useState("");
  const [finalDescription, setFinalDescription] = useState("");

  const [requestsPage, setRequestsPage] = useState(1);
  const [jobsPage, setJobsPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "superadmin") {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [router]);

  useEffect(() => {
    filterRequests();
  }, [requestSearchQuery, requestDateFilter, allPendingRequests]);

  useEffect(() => {
    filterJobs();
  }, [jobSearchQuery, jobDateFilter, allJobs]);

  const loadData = async () => {
    try {
      const requestsData = await apiCall("/job-requests", { method: "GET" });

      if (requestsData.success) {
        const pending = requestsData.jobRequests.filter(
          (req: JobRequest) => req.status === "pending",
        );
        setAllPendingRequests(pending);
        setFilteredRequests(pending);
        setAllRequests(requestsData.jobRequests);
      }

      const jobsData = await apiCall("/jobs", { method: "GET" });

      if (jobsData.success) {
        const activeJobs = jobsData.jobs.filter(
          (job: Job) =>
            !job.completed && new Date(job.event_end_date) >= new Date(),
        );
        setAllJobs(activeJobs);
        setFilteredJobs(activeJobs);
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

  const filterRequests = () => {
    let filtered = [...allPendingRequests];

    // Search by title
    if (requestSearchQuery.trim()) {
      filtered = filtered.filter((req) =>
        req.title.toLowerCase().includes(requestSearchQuery.toLowerCase()),
      );
    }

    // Filter by date
    if (requestDateFilter) {
      filtered = filtered.filter(
        (req) => req.event_start_date === requestDateFilter,
      );
    }

    setFilteredRequests(filtered);
    setRequestsPage(1);
  };

  const filterJobs = () => {
    let filtered = [...allJobs];

    // Search by title
    if (jobSearchQuery.trim()) {
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(jobSearchQuery.toLowerCase()),
      );
    }

    // Filter by date
    if (jobDateFilter) {
      filtered = filtered.filter(
        (job) => job.event_start_date === jobDateFilter,
      );
    }

    setFilteredJobs(filtered);
    setJobsPage(1);
  };

  const clearRequestFilters = () => {
    setRequestSearchQuery("");
    setRequestDateFilter("");
  };

  const clearJobFilters = () => {
    setJobSearchQuery("");
    setJobDateFilter("");
  };

  const openApprovalModal = (request: JobRequest) => {
    setSelectedRequest(request);
    setFinalTitle(request.title);
    setFinalPayment(request.payment_offered);
    setFinalDescription(request.description);
    setShowApprovalModal(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest || !finalTitle || !finalPayment) {
      alert("Please fill all required fields!");
      return;
    }

    setProcessing(true);

    try {
      const data = await apiCall(
        `/job-requests/${selectedRequest.id}/approve`,
        {
          method: "POST",
          body: JSON.stringify({
            finalTitle,
            finalPayment,
            finalDescription,
            postedBy: "admin@eventhire.com",
            requestData: selectedRequest,
          }),
        },
      );

      if (data.success) {
        alert("✅ Job approved and posted successfully!");
        setShowApprovalModal(false);
        setSelectedRequest(null);
        await loadData();
      }
    } catch (error: any) {
      alert(error.message || "Failed to approve job");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert("Please provide a rejection reason!");
      return;
    }

    setProcessing(true);

    try {
      const data = await apiCall(`/job-requests/${selectedRequest.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionReason }),
      });

      if (data.success) {
        alert("Request rejected.");
        setShowRejectModal(false);
        setSelectedRequest(null);
        setRejectionReason("");
        await loadData();
      }
    } catch (error: any) {
      alert(error.message || "Failed to reject request");
    } finally {
      setProcessing(false);
    }
  };

  // Pagination logic for requests
  const totalRequestsPages = Math.ceil(
    filteredRequests.length / REQUESTS_PER_PAGE,
  );
  const requestsStartIndex = (requestsPage - 1) * REQUESTS_PER_PAGE;
  const requestsEndIndex = requestsStartIndex + REQUESTS_PER_PAGE;
  const currentRequests = filteredRequests.slice(
    requestsStartIndex,
    requestsEndIndex,
  );

  // Pagination logic for jobs
  const totalJobsPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const jobsStartIndex = (jobsPage - 1) * JOBS_PER_PAGE;
  const jobsEndIndex = jobsStartIndex + JOBS_PER_PAGE;
  const currentJobs = filteredJobs.slice(jobsStartIndex, jobsEndIndex);

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

  const pendingAppsCount = applications.filter(
    (app) => app.status === "pending",
  ).length;
  const acceptedAppsCount = applications.filter(
    (app) => app.status === "accepted",
  ).length;

  return (
    <>
    <SuperAdminSidebar />
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10 mt-1">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10">
        <div className="flex justify-between items-center gap-4">
          <div>
            <span className="text-2xl md:text-3xl">👑</span>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2">
              <span>SuperAdmin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">
              Full platform control & management
            </p>
          </div>

          {/* Desktop Menu */}
          {/* <div className="hidden lg:flex items-center gap-2 xl:gap-3">
            <button
              onClick={() => router.push("/superadmin/messages")}
              className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-4 xl:px-6 py-2.5 xl:py-3 rounded-2xl hover:from-pink-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg text-sm xl:text-base flex items-center gap-2"
            >
              <span className="text-base xl:text-lg">💬</span>
              <span className="hidden xl:inline">Messages</span>
              <span className="xl:hidden">DMs</span>
            </button>
            <button
              onClick={() => router.push("/superadmin/all-requests")}
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 xl:px-6 py-2.5 xl:py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg text-sm xl:text-base flex items-center gap-2"
            >
              <span className="text-base xl:text-lg">📋</span>
              <span className="hidden xl:inline">View All Requests</span>
              <span className="xl:hidden">Requests</span>
            </button>
            <button
              onClick={() => router.push("/superadmin/create-company")}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 xl:px-6 py-2.5 xl:py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg text-sm xl:text-base flex items-center gap-2"
            >
              <span className="text-base xl:text-lg">➕</span>
              <span className="hidden xl:inline">Create Company</span>
              <span className="xl:hidden">Company</span>
            </button>

            <button
              onClick={() => {
                const password = prompt(
                  "Enter SuperAdmin password to access Company Management:",
                );
                if (password === "123456") {
                  router.push("/superadmin/edit-companies");
                } else if (password !== null) {
                  alert("❌ Incorrect password!");
                }
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 xl:px-6 py-2.5 xl:py-3 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-lg text-sm xl:text-base flex items-center gap-2"
            >
              <span className="text-base xl:text-lg">🏢</span>
              <span className="hidden xl:inline">Edit Companies</span>
              <span className="xl:hidden">Companies</span>
            </button>
            <button
              onClick={() => {
                const password = prompt(
                  "Enter SuperAdmin password to access User Management:",
                );
                if (password === "123456") {
                  router.push("/superadmin/edit-users");
                } else if (password !== null) {
                  alert("❌ Incorrect password!");
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 xl:px-6 py-2.5 xl:py-3 rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg text-sm xl:text-base flex items-center gap-2"
            >
              <span className="text-base xl:text-lg">👤</span>
              <span className="hidden xl:inline">Edit Users</span>
              <span className="xl:hidden">Users</span>
            </button>
            <LogoutButton />
          </div> */}

          {/* Mobile Hamburger Button */}
          {/* <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`w-6 h-0.5 bg-indigo-600 transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
            />
            <span
              className={`w-6 h-0.5 bg-indigo-600 transition-all ${mobileMenuOpen ? "opacity-0" : ""}`}
            />
            <span
              className={`w-6 h-0.5 bg-indigo-600 transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
            />
          </button> */}
        </div>

        {/* Mobile Menu Dropdown */}
        {/* {mobileMenuOpen && (
          <div className="lg:hidden mt-4 space-y-3 pb-4 border-t border-gray-200 pt-4">
            <button
              onClick={() => {
                router.push("/superadmin/all-requests");
                setMobileMenuOpen(false);
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">📋</span>
              <span>View All Requests</span>
            </button>

            <button
              onClick={() => {
                router.push("/superadmin/create-company");
                setMobileMenuOpen(false);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">➕</span>
              <span>Create Company</span>
            </button>

            <button
              onClick={() => {
                const password = prompt(
                  "Enter SuperAdmin password to access Company Management:",
                );
                if (password === "123456") {
                  router.push("/superadmin/edit-companies");
                  setMobileMenuOpen(false);
                } else if (password !== null) {
                  alert("❌ Incorrect password!");
                }
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-3 rounded-2xl hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">🏢</span>
              <span>Edit Companies</span>
            </button>
            <button
              onClick={() => {
                const password = prompt(
                  "Enter SuperAdmin password to access User Management:",
                );
                if (password === "123456") {
                  router.push("/superadmin/edit-users");
                  setMobileMenuOpen(false);
                } else if (password !== null) {
                  alert("❌ Incorrect password!");
                }
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-3 rounded-2xl hover:from-orange-600 hover:to-red-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
            >
              <span className="text-lg">👤</span>
              <span>Edit Users</span>
            </button>
            <div className="pt-2">
              <LogoutButton />
            </div>
          </div>
        )} */}
      </div>

      {/* Stats Overview */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">
            {allPendingRequests.length}
          </p>
          <p className="text-yellow-600 font-semibold">Pending Requests</p>
        </div>
        <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{allJobs.length}</p>
          <p className="text-blue-600 font-semibold">Active Jobs</p>
        </div>
        <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {pendingAppsCount}
          </p>
          <p className="text-green-600 font-semibold">Pending Applications</p>
        </div>
        <div className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">
            {acceptedAppsCount}
          </p>
          <p className="text-purple-600 font-semibold">Accepted Candidates</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ✅ Pending Requests with Search & Filters */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-800 mb-4">
            ⏳ Pending Job Requests ({filteredRequests.length})
          </h2>

          {/* Compact Search & Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 mb-4 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Search by title..."
                value={requestSearchQuery}
                onChange={(e) => setRequestSearchQuery(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={requestDateFilter}
                  onChange={(e) => setRequestDateFilter(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                {(requestSearchQuery || requestDateFilter) && (
                  <button
                    onClick={clearRequestFilters}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {requestSearchQuery || requestDateFilter
                  ? "No requests match your filters."
                  : "No pending requests!"}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border-2 border-yellow-200 dark:border-yellow-700 hover:shadow-2xl transition-all"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                          {request.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          🏢 {request.company_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                          Submitted: {request.submitted_at}
                        </p>
                      </div>
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full text-xs font-semibold">
                        NEW
                      </span>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Type:</span>{" "}
                        {request.event_type}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Location:</span>{" "}
                        {request.location}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Date:</span>{" "}
                        {request.event_start_date === request.event_end_date
                          ? request.event_start_date
                          : `${request.event_start_date} to ${request.event_end_date}`}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Helpers:</span>{" "}
                        {request.helpers_needed}
                      </p>
                      <p className="text-gray-800 dark:text-gray-200 font-bold">
                        <span className="font-medium">Payment Offered:</span>{" "}
                        {request.payment_offered}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openApprovalModal(request)}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg"
                      >
                        ✓ Approve & Post
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination for Requests */}
              {totalRequestsPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setRequestsPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={requestsPage === 1}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 font-semibold hover:bg-yellow-50 dark:hover:bg-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from(
                      { length: totalRequestsPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setRequestsPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold text-sm transition-all ${
                          requestsPage === page
                            ? "bg-yellow-500 dark:bg-yellow-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setRequestsPage((prev) =>
                        Math.min(totalRequestsPages, prev + 1),
                      )
                    }
                    disabled={requestsPage === totalRequestsPages}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400 font-semibold hover:bg-yellow-50 dark:hover:bg-yellow-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ✅ My Active Jobs with Search & Filters */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-800 mb-4">
            🎯 My Active Jobs ({filteredJobs.length})
          </h2>

          {/* Compact Search & Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-3 mb-4 border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 gap-2">
              <input
                type="text"
                placeholder="Search by title..."
                value={jobSearchQuery}
                onChange={(e) => setJobSearchQuery(e.target.value)}
                className="w-full border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={jobDateFilter}
                  onChange={(e) => setJobDateFilter(e.target.value)}
                  className="flex-1 border border-gray-200 dark:border-gray-600 p-2 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                />
                {(jobSearchQuery || jobDateFilter) && (
                  <button
                    onClick={clearJobFilters}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {jobSearchQuery || jobDateFilter
                  ? "No jobs match your filters."
                  : "No active jobs posted yet."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {currentJobs.map((job) => {
                  const jobApplicants = applications.filter(
                    (app) => app.job_id === job.id,
                  );
                  const pendingCount = jobApplicants.filter(
                    (app) => app.status === "pending",
                  ).length;
                  const acceptedCount = jobApplicants.filter(
                    (app) => app.status === "accepted",
                  ).length;

                  return (
                    <div
                      key={job.id}
                      onClick={() =>
                        router.push(`/superadmin/applicants/${job.id}`)
                      }
                      className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
                    >
                      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {job.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        🏢 {job.company_name} • 📅{" "}
                        {job.event_start_date === job.event_end_date
                          ? job.event_start_date
                          : `${job.event_start_date} to ${job.event_end_date}`}
                      </p>

                      <div className="flex gap-2 mb-3">
                        <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-semibold">
                          ⏳ {pendingCount} Pending
                        </span>
                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                          ✓ {acceptedCount} Accepted
                        </span>
                      </div>

                      <p className="text-sm text-gray-800 dark:text-gray-200 font-semibold">
                        Posted Payment: {job.payment}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for Jobs */}
              {totalJobsPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-2">
                  <button
                    onClick={() => setJobsPage((prev) => Math.max(1, prev - 1))}
                    disabled={jobsPage === 1}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    ← Prev
                  </button>

                  <div className="flex gap-1">
                    {Array.from(
                      { length: totalJobsPages },
                      (_, i) => i + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        onClick={() => setJobsPage(page)}
                        className={`w-8 h-8 rounded-lg font-semibold text-sm transition-all ${
                          jobsPage === page
                            ? "bg-blue-500 dark:bg-blue-600 text-white"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setJobsPage((prev) => Math.min(totalJobsPages, prev + 1))
                    }
                    disabled={jobsPage === totalJobsPages}
                    className="px-3 py-2 bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              ✓ Approve & Post Job
            </h2>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-blue-800 mb-2">
                Original Request:
              </h3>
              <p className="text-sm text-blue-700">
                Company: {selectedRequest.company_name}
              </p>
              <p className="text-sm text-blue-700">
                Payment Offered: {selectedRequest.payment_offered}
              </p>
              <p className="text-sm text-blue-700">
                Helpers: {selectedRequest.helpers_needed}
              </p>
            </div>

            <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-6">
              <h3 className="font-bold text-green-800 mb-4">
                Post as (Edit if needed):
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                    value={finalTitle}
                    onChange={(e) => setFinalTitle(e.target.value)}
                    required
                    disabled={processing}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment to Post (Your Cut: Offer less than{" "}
                    {selectedRequest.payment_offered})
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                    value={finalPayment}
                    onChange={(e) => setFinalPayment(e.target.value)}
                    placeholder="e.g., ₹1500/day"
                    required
                    disabled={processing}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Company offered {selectedRequest.payment_offered}.
                    You can post it lower to keep the difference as profit.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[100px] bg-white focus:outline-none focus:ring-2 focus:ring-green-400 resize-none text-gray-800"
                    value={finalDescription}
                    onChange={(e) => setFinalDescription(e.target.value)}
                    required
                    disabled={processing}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Approving..." : "Approve & Post Job"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Reject Request
            </h2>
            <p className="text-gray-600 mb-4">
              For:{" "}
              <span className="font-semibold">{selectedRequest.title}</span>
            </p>
            <textarea
              placeholder="Reason for rejection..."
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-gray-800"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={processing}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg disabled:opacity-50"
                disabled={processing}
              >
                {processing ? "Rejecting..." : "Reject Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </>
  );
  
}
