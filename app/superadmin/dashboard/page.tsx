"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import { checkSuperAdminAuth } from "@/lib/auth";

type JobRequest = {
  id: string;
  companyEmail: string;
  companyName: string;
  title: string;
  eventType: string;
  location: string;
  helpersNeeded: number;
  date: string;
  time: string;
  paymentOffered: string;
  description: string;
  contactPhone: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  rejectionReason?: string;
  approvedJobId?: string;
};

type Job = {
  id: string;
  requestId: string;
  companyEmail: string;
  companyName: string;
  postedBy: string;
  title: string;
  eventType: string;
  location: string;
  helpersNeeded: number;
  date: string;
  time: string;
  payment: string;
  description: string;
  contactPhone: string;
  completed?: boolean;
  createdAt: string;
};

type Application = {
  jobId: string;
  name: string;
  status: "pending" | "accepted" | "rejected";
};

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<JobRequest[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<JobRequest | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  // For posting job after approval
  const [finalTitle, setFinalTitle] = useState("");
  const [finalPayment, setFinalPayment] = useState("");
  const [finalDescription, setFinalDescription] = useState("");

  useEffect(() => {
    if (!checkSuperAdminAuth()) {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = () => {
    // Load pending requests
    const allRequests: JobRequest[] = JSON.parse(
      localStorage.getItem("jobRequests") || "[]"
    );
    const pending = allRequests.filter((req) => req.status === "pending");
    setPendingRequests(pending);

    // Load my posted jobs
    const allJobs: Job[] = JSON.parse(localStorage.getItem("jobs") || "[]");
    const activeJobs = allJobs.filter(
      (job) => !job.completed && new Date(job.date) >= new Date()
    );
    setMyJobs(activeJobs);

    // Load applications
    const allApplications = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    setApplications(allApplications);
  };

  const openApprovalModal = (request: JobRequest) => {
    setSelectedRequest(request);
    setFinalTitle(request.title);
    setFinalPayment(request.paymentOffered); // Pre-fill, admin can adjust
    setFinalDescription(request.description);
    setShowApprovalModal(true);
  };

  const handleApprove = () => {
    if (!selectedRequest || !finalTitle || !finalPayment) {
      alert("Please fill all required fields!");
      return;
    }

    // Create the actual job
    const newJob: Job = {
      id: Date.now().toString(),
      requestId: selectedRequest.id,
      companyEmail: selectedRequest.companyEmail,
      companyName: selectedRequest.companyName,
      postedBy: "admin@eventhire.com",
      title: finalTitle,
      eventType: selectedRequest.eventType,
      location: selectedRequest.location,
      helpersNeeded: selectedRequest.helpersNeeded,
      date: selectedRequest.date,
      time: selectedRequest.time,
      payment: finalPayment,
      description: finalDescription,
      contactPhone: selectedRequest.contactPhone,
      completed: false,
      createdAt: new Date().toLocaleDateString(),
    };

    // Save job
    const oldJobs = JSON.parse(localStorage.getItem("jobs") || "[]");
    localStorage.setItem("jobs", JSON.stringify([...oldJobs, newJob]));

    // Update request status
    const allRequests = JSON.parse(localStorage.getItem("jobRequests") || "[]");
    const updatedRequests = allRequests.map((req: JobRequest) => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: "approved" as const,
          approvedJobId: newJob.id,
        };
      }
      return req;
    });
    localStorage.setItem("jobRequests", JSON.stringify(updatedRequests));

    alert("✅ Job approved and posted successfully!");
    setShowApprovalModal(false);
    setSelectedRequest(null);
    loadData();
  };

  const handleReject = () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert("Please provide a rejection reason!");
      return;
    }

    const allRequests = JSON.parse(localStorage.getItem("jobRequests") || "[]");
    const updatedRequests = allRequests.map((req: JobRequest) => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: "rejected" as const,
          rejectionReason,
        };
      }
      return req;
    });
    localStorage.setItem("jobRequests", JSON.stringify(updatedRequests));

    alert("Request rejected.");
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason("");
    loadData();
  };

  const getAllJobRequests = () => {
    return JSON.parse(localStorage.getItem("jobRequests") || "[]");
  };

  const getAllJobs = () => {
    return JSON.parse(localStorage.getItem("jobs") || "[]");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
            👑 SuperAdmin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">Full platform control & management</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg"
          >
            {showHistory ? "Hide" : "Show"} All Requests
          </button>
          <LogoutButton />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-yellow-100 border-2 border-yellow-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-yellow-700">{pendingRequests.length}</p>
          <p className="text-yellow-600 font-semibold">Pending Requests</p>
        </div>
        <div className="bg-blue-100 border-2 border-blue-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{myJobs.length}</p>
          <p className="text-blue-600 font-semibold">Active Jobs</p>
        </div>
        <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">
            {applications.filter((app) => app.status === "pending").length}
          </p>
          <p className="text-green-600 font-semibold">Pending Applications</p>
        </div>
        <div className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">
            {applications.filter((app) => app.status === "accepted").length}
          </p>
          <p className="text-purple-600 font-semibold">Accepted Candidates</p>
        </div>
      </div>

      {/* All Requests History */}
      {showHistory && (
        <div className="max-w-6xl mx-auto mb-8 bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">All Job Requests History</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {getAllJobRequests().map((request: JobRequest) => (
              <div
                key={request.id}
                className="flex justify-between items-center p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{request.title}</h4>
                  <p className="text-sm text-gray-600">
                    {request.companyName} • {request.date}
                  </p>
                  <p className="text-sm text-gray-600">
                    Offered: {request.paymentOffered}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {request.status === "approved" && (
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✓ Approved
                    </span>
                  )}
                  {request.status === "rejected" && (
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ✗ Rejected
                    </span>
                  )}
                  {request.status === "pending" && (
                    <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      ⏳ Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            ⏳ Pending Job Requests ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500">No pending requests!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-3xl shadow-xl p-6 border-2 border-yellow-200 hover:shadow-2xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">
                        {request.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        🏢 {request.companyName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Submitted: {request.submittedAt}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                      NEW
                    </span>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <p className="text-gray-600">
                      <span className="font-medium">Type:</span> {request.eventType}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {request.location}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {request.date} at{" "}
                      {request.time}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Helpers:</span> {request.helpersNeeded}
                    </p>
                    <p className="text-gray-800 font-bold">
                      <span className="font-medium">Payment Offered:</span>{" "}
                      {request.paymentOffered}
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
          )}
        </div>

        {/* My Active Jobs */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            🎯 My Active Jobs ({myJobs.length})
          </h2>

          {myJobs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500">No active jobs posted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {myJobs.map((job) => {
                const jobApplicants = applications.filter(
                  (app) => app.jobId === job.id
                );
                const pendingCount = jobApplicants.filter(
                  (app) => app.status === "pending"
                ).length;
                const acceptedCount = jobApplicants.filter(
                  (app) => app.status === "accepted"
                ).length;

                return (
                  <div
                    key={job.id}
                    onClick={() => router.push(`/superadmin/applicants/${job.id}`)}
                    className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl hover:scale-105 transition-all cursor-pointer"
                  >
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      🏢 {job.companyName} • {job.date}
                    </p>

                    <div className="flex gap-2 mb-3">
                      <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ⏳ {pendingCount} Pending
                      </span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ {acceptedCount} Accepted
                      </span>
                    </div>

                    <p className="text-sm text-gray-800 font-semibold">
                      Posted Payment: {job.payment}
                    </p>
                  </div>
                );
              })}
            </div>
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
              <h3 className="font-bold text-blue-800 mb-2">Original Request:</h3>
              <p className="text-sm text-blue-700">
                Company: {selectedRequest.companyName}
              </p>
              <p className="text-sm text-blue-700">
                Payment Offered: {selectedRequest.paymentOffered}
              </p>
              <p className="text-sm text-blue-700">
                Helpers: {selectedRequest.helpersNeeded}
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment to Post (Your Cut: Offer less than{" "}
                    {selectedRequest.paymentOffered})
                  </label>
                  <input
                    type="text"
                    className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-800"
                    value={finalPayment}
                    onChange={(e) => setFinalPayment(e.target.value)}
                    placeholder="e.g., ₹1500/day"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Tip: Company offered {selectedRequest.paymentOffered}. You can
                    post it lower to keep the difference as profit.
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
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg"
              >
                Approve & Post Job
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
              For: <span className="font-semibold">{selectedRequest.title}</span>
            </p>
            <textarea
              placeholder="Reason for rejection..."
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-red-400 resize-none text-gray-800"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-2xl hover:bg-gray-300 transition-all font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white py-3 rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all font-semibold shadow-lg"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}