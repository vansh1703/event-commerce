"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";
import Footer from "@/components/Footer";

type Application = {
  id: string;
  job_id: string;
  name: string;
  phone: string;
  age: number;
  city: string;
  experience: string;
  availability: string;
  applied_at: string;
  status: "pending" | "accepted" | "rejected";
};

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
  payment: string;
  completed: boolean;
};

type SeekerStats = {
  avgRating: string;
  ratings: Array<{ stars: number; job_title: string; date: string }>;
  redFlags: Array<{ reason: string; job_title: string; date: string }>;
  redFlagCount: number;
};

const ITEMS_PER_PAGE = 15;

export default function CompletedEventsPage() {
  const router = useRouter();
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<SeekerStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [flagFilter, setFlagFilter] = useState<string>("all");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, locationFilter, ratingFilter, flagFilter, allApplications]);

  const checkAuth = async () => {
    const user = localStorage.getItem("seekerUser");

    if (!user) {
      router.push("/seeker/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setSeekerUser(parsedUser);
    await loadData(parsedUser.id);
  };

  const loadData = async (seekerId: string) => {
    try {
      const appsRes = await fetch(`/api/applications?seekerId=${seekerId}`, {
        method: "GET",
      });
      const appsData = await appsRes.json();

      const jobsRes = await fetch("/api/jobs", { method: "GET" });
      const jobsData = await jobsRes.json();

      const statsRes = await fetch(`/api/seekers/${seekerId}/stats`, {
        method: "GET",
      });
      const statsData = await statsRes.json();

      if (appsData.success && jobsData.success && statsData.success) {
        // Filter only completed applications
        const completedApps = appsData.applications.filter((app: Application) => {
          const job = jobsData.jobs.find((j: Job) => j.id === app.job_id);
          if (!job) return false;
          if (app.status !== "accepted") return false;
          return job.completed || new Date(job.event_end_date) < new Date();
        });

        setAllApplications(completedApps);
        setFilteredApplications(completedApps);
        setJobs(jobsData.jobs);
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allApplications];

    // Search by job title
    if (searchQuery.trim()) {
      filtered = filtered.filter((app) => {
        const job = getJobDetails(app.job_id);
        return job?.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by location
    if (locationFilter.trim()) {
      filtered = filtered.filter((app) => {
        const job = getJobDetails(app.job_id);
        return job?.location.toLowerCase().includes(locationFilter.toLowerCase());
      });
    }

    // Filter by rating
    if (ratingFilter !== "all") {
      filtered = filtered.filter((app) => {
        const job = getJobDetails(app.job_id);
        if (!job) return false;
        const jobRating = stats?.ratings.find((r) => r.job_title === job.title);
        
        if (ratingFilter === "rated") {
          return !!jobRating;
        } else if (ratingFilter === "not_rated") {
          return !jobRating;
        }
        return true;
      });
    }

    // Filter by red flag
    if (flagFilter !== "all") {
      filtered = filtered.filter((app) => {
        const job = getJobDetails(app.job_id);
        if (!job) return false;
        const jobFlag = stats?.redFlags.find((f) => f.job_title === job.title);
        
        if (flagFilter === "flagged") {
          return !!jobFlag;
        } else if (flagFilter === "not_flagged") {
          return !jobFlag;
        }
        return true;
      });
    }

    setFilteredApplications(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setRatingFilter("all");
    setFlagFilter("all");
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find((job) => job.id === jobId);
  };

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentApplications = filteredApplications.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading completed events...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-7xl mx-auto">
          <SeekerNavbar />

          <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent m-4">
            Completed Events History
          </h1>

          {/* ✅ SEARCH & FILTERS - Added mobile spacing */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 border border-white/20 mb-8 mt-6 md:mt-0">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔍 Search & Filter Completed Events
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search by Job Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Wedding Helpers"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Filter by Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Location
                </label>
                <input
                  type="text"
                  placeholder="e.g., Delhi"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder:text-gray-400"
                />
              </div>

              {/* Filter by Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Rating
                </label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                >
                  <option value="all">All Events</option>
                  <option value="rated">Rated</option>
                  <option value="not_rated">Not Rated</option>
                </select>
              </div>

              {/* Filter by Red Flag */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Red Flag
                </label>
                <select
                  value={flagFilter}
                  onChange={(e) => setFlagFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 p-3 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                >
                  <option value="all">All Events</option>
                  <option value="flagged">Flagged</option>
                  <option value="not_flagged">Not Flagged</option>
                </select>
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
            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-indigo-600">{filteredApplications.length}</span> completed events
              {(searchQuery || locationFilter || ratingFilter !== "all" || flagFilter !== "all") && (
                <span className="ml-2 text-purple-600">(filtered)</span>
              )}
            </div>
          </div>

          {/* ✅ COMPLETED EVENTS LIST - White cards always */}
          {currentApplications.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 md:p-8 text-center border border-white/20">
              <p className="text-gray-500 mb-4">
                {(searchQuery || locationFilter || ratingFilter !== "all" || flagFilter !== "all")
                  ? "No completed events match your filters."
                  : "No completed events yet."}
              </p>
              {(searchQuery || locationFilter || ratingFilter !== "all" || flagFilter !== "all") && (
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {currentApplications.map((app) => {
                  const job = getJobDetails(app.job_id);
                  if (!job) return null;

                  const jobRating = stats?.ratings.find((r) => r.job_title === job.title);
                  const jobFlag = stats?.redFlags.find((f) => f.job_title === job.title);

                  return (
                    <div
                      key={app.id}
                      className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 border border-white/20"
                    >
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">
                            {job.title}
                          </h2>
                          <p className="text-sm text-gray-600">
                            {job.event_type} • {job.location}
                          </p>

                          <p className="text-sm text-gray-600">
                            📅 {job.event_start_date === job.event_end_date
                              ? job.event_start_date
                              : `${job.event_start_date} to ${job.event_end_date}`}
                          </p>

                          <p className="text-sm text-gray-600">
                            🕐 {job.event_start_time === job.event_end_time
                              ? job.event_start_time
                              : `${job.event_start_time} - ${job.event_end_time}`}
                          </p>

                          <p className="text-sm text-gray-600">💰 {job.payment}</p>
                        </div>

                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg">
                          ✓ Completed
                        </span>
                      </div>

                      {jobRating && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-3">
                          <p className="text-sm font-semibold text-yellow-800 mb-1">
                            Your Rating:
                          </p>
                          <p className="text-yellow-600">
                            {"⭐".repeat(jobRating.stars)} ({jobRating.stars}/5)
                          </p>
                          <p className="text-xs text-yellow-500 mt-1">{jobRating.date}</p>
                        </div>
                      )}

                      {jobFlag && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-3">
                          <p className="text-sm font-semibold text-red-800 mb-1">
                            🚩 Red Flag:
                          </p>
                          <p className="text-red-600">{jobFlag.reason}</p>
                          <p className="text-xs text-red-500 mt-1">{jobFlag.date}</p>
                        </div>
                      )}

                      <div className="bg-gray-50 rounded-2xl p-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Completed on:</span> {job.event_end_date}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ✅ PAGINATION */}
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
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
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

      <Footer />
    </main>
  );
}