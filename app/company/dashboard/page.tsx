"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import * as XLSX from 'xlsx';

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

type SeekerProfile = {
  name: string;
  email: string;
  phone: string;
  redFlags: Array<{ date: string; reason: string; jobTitle: string }>;
  ratings: Array<{ stars: number; jobTitle: string; date: string }>;
  bannedUntil: string | null;
};

export default function CompanyDashboard() {
  const router = useRouter();
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  
  const [myRequests, setMyRequests] = useState<JobRequest[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [selectedCandidate, setSelectedCandidate] = useState<Application | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [seekerProfile, setSeekerProfile] = useState<SeekerProfile | null>(null);

  useEffect(() => {
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    
    if (parsedUser.role === "superadmin") {
      router.push("/superadmin/dashboard");
      return;
    }

    setCompanyEmail(parsedUser.email);
    setCompanyName(parsedUser.companyName || "Company");
    
    loadData(parsedUser.email);
  }, [router]);

  const loadData = (email: string) => {
    // Load job requests
    const allRequests: JobRequest[] = JSON.parse(
      localStorage.getItem("jobRequests") || "[]"
    );
    const myReqs = allRequests.filter((req) => req.companyEmail === email);
    setMyRequests(myReqs);

    // Load approved jobs
    const allJobs: Job[] = JSON.parse(localStorage.getItem("jobs") || "[]");
    const myApprovedJobs = allJobs.filter((job) => job.companyEmail === email);
    setApprovedJobs(myApprovedJobs);

    // Load applications
    const allApplications: Application[] = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    setApplications(allApplications);
  };

  const openCandidateModal = (candidate: Application) => {
    setSelectedCandidate(candidate);
    
    const seekerAccounts: SeekerProfile[] = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );
    const profile = seekerAccounts.find(
      (acc) => acc.name === candidate.name
    );
    setSeekerProfile(profile || null);
    
    setShowCandidateModal(true);
  };

  const exportCandidates = (jobId: string, jobTitle: string) => {
    const acceptedCandidates = applications.filter(
      (app) => app.jobId === jobId && app.status === "accepted"
    );
    
    if (acceptedCandidates.length === 0) {
      alert("No accepted candidates to export for this job!");
      return;
    }

    const exportData = acceptedCandidates.map((app) => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Accepted Candidates");
    
    XLSX.writeFile(workbook, `${jobTitle}_Accepted_Candidates.xlsx`);
    alert("✅ Candidate list exported successfully!");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const pendingRequests = myRequests.filter((req) => req.status === "pending");
  const approvedRequests = myRequests.filter((req) => req.status === "approved");
  const rejectedRequests = myRequests.filter((req) => req.status === "rejected");

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {companyName} Dashboard
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
          <p className="text-3xl font-bold text-yellow-700">{pendingRequests.length}</p>
          <p className="text-yellow-600 font-semibold">Pending Approval</p>
        </div>
        <div className="bg-green-100 border-2 border-green-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{approvedJobs.length}</p>
          <p className="text-green-600 font-semibold">Approved Jobs</p>
        </div>
        <div className="bg-red-100 border-2 border-red-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{rejectedRequests.length}</p>
          <p className="text-red-600 font-semibold">Rejected Requests</p>
        </div>
        <div className="bg-purple-100 border-2 border-purple-300 rounded-2xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-700">
            {applications.filter((app) => app.status === "accepted").length}
          </p>
          <p className="text-purple-600 font-semibold">Total Accepted</p>
        </div>
      </div>

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
                      <h3 className="text-xl font-bold text-gray-800">{req.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {req.eventType} • {req.location}
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">
                      PENDING
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📅 {req.date} at {req.time}</p>
                    <p>👥 {req.helpersNeeded} helpers needed</p>
                    <p>💰 Offered: {req.paymentOffered}</p>
                    <p className="text-xs text-gray-500">Submitted: {req.submittedAt}</p>
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
                      <h3 className="text-xl font-bold text-gray-800">{req.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {req.eventType} • {req.location}
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-semibold">
                      REJECTED
                    </span>
                  </div>
                  {req.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-3 mb-3">
                      <p className="text-sm text-red-800 font-semibold mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700">{req.rejectionReason}</p>
                    </div>
                  )}
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📅 {req.date} at {req.time}</p>
                    <p>💰 Offered: {req.paymentOffered}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Jobs with Accepted Candidates */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ✓ Approved Jobs & Accepted Candidates ({approvedJobs.length})
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
            <div className="space-y-6">
              {approvedJobs.map((job) => {
                const jobApplicants = applications.filter((app) => app.jobId === job.id);
                const acceptedCandidates = jobApplicants.filter((app) => app.status === "accepted");
                const pendingCandidates = jobApplicants.filter((app) => app.status === "pending");

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100"
                  >
                    {/* Job Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                          {job.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {job.eventType} • {job.location} • {job.date} at {job.time}
                        </p>
                        {/* <p className="text-sm text-gray-600 mt-1">
                          💰 Posted Payment: {job.payment}
                        </p> */}
                      </div>
                      
                      {acceptedCandidates.length > 0 && (
                        <button
                          onClick={() => exportCandidates(job.id, job.title)}
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg flex items-center gap-2"
                        >
                          📊 Export to Excel
                        </button>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 mb-6 flex-wrap">
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
                    </div>

                    {/* Accepted Candidates List */}
                    {acceptedCandidates.length === 0 ? (
                      <div className="bg-gray-50 rounded-2xl p-6 text-center">
                        <p className="text-gray-500">
                          No candidates accepted yet. Admin is reviewing applications.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <h4 className="font-bold text-gray-800 mb-4">
                          Accepted Candidates:
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {acceptedCandidates.map((candidate, index) => (
                            <div
                              key={index}
                              onClick={() => openCandidateModal(candidate)}
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
                              <p className="text-sm text-gray-600">📱 {candidate.phone}</p>
                              <p className="text-sm text-gray-600">🎂 {candidate.age} years</p>
                              <p className="text-sm text-gray-600">⏰ {candidate.availability}</p>
                              <p className="text-xs text-green-600 mt-2 font-semibold">
                                Click for full details →
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg flex-shrink-0">
                {getInitials(selectedCandidate.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  {selectedCandidate.name}
                </h2>
                <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg inline-block">
                  ✓ Accepted by Admin
                </span>

                {/* Stats */}
                {seekerProfile && (
                  <div className="flex gap-3 mt-3 flex-wrap">
                    <span className="text-sm flex items-center gap-1">
                      ⭐{" "}
                      <span className="font-semibold">
                        {Number(getSeekerStats().avgRating) > 0
                          ? getSeekerStats().avgRating
                          : "No ratings"}
                      </span>
                    </span>
                    <span
                      className={`text-sm flex items-center gap-1 ${
                        getSeekerStats().redFlagCount > 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
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

            {/* Experience */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <p className="text-sm text-gray-500 mb-1">Experience</p>
              <p className="text-gray-800">{selectedCandidate.experience}</p>
            </div>

            {/* Applied Date */}
            <p className="text-sm text-gray-500 mb-6">
              Applied on: {selectedCandidate.appliedAt}
            </p>

            {/* Red Flags (if any) */}
            {seekerProfile && seekerProfile.redFlags && seekerProfile.redFlags.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  🚩 Red Flags ({seekerProfile.redFlags.length})
                </h3>
                <div className="space-y-2">
                  {seekerProfile.redFlags.map((flag, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-sm font-semibold text-red-700">{flag.jobTitle}</p>
                      <p className="text-sm text-red-600">{flag.reason}</p>
                      <p className="text-xs text-red-500 mt-1">{flag.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings (if any) */}
            {seekerProfile && seekerProfile.ratings && seekerProfile.ratings.length > 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
                <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                  ⭐ Previous Ratings ({seekerProfile.ratings.length})
                </h3>
                <div className="space-y-2">
                  {seekerProfile.ratings.map((rating, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-yellow-200">
                      <p className="text-sm font-semibold text-yellow-700">{rating.jobTitle}</p>
                      <p className="text-sm text-yellow-600">{"⭐".repeat(rating.stars)} ({rating.stars}/5)</p>
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
    </main>
  );
}