"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";
import Footer from "@/components/Footer";

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  payment: string;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
  completed: boolean;
  archived: boolean;
};

const ITEMS_PER_PAGE = 15;

export default function EventsPage() {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    loadJobs();
    checkUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, locationFilter, dateFilter, allJobs]);

  const checkUser = () => {
    const user = localStorage.getItem("seekerUser");
    if (user) {
      setSeekerUser(JSON.parse(user));
    }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch("/api/jobs", { method: "GET" });
      const data = await res.json();

      if (data.success) {
        const activeJobs = data.jobs.filter((job: Job) => {
          if (job.completed) return false;
          if (job.archived) return false;

          const eventEndDate = new Date(job.event_end_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return eventEndDate >= today;
        });

        setAllJobs(activeJobs);
        setFilteredJobs(activeJobs);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allJobs];

    // Search by title
    if (searchQuery.trim()) {
      filtered = filtered.filter((job) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by location
    if (locationFilter.trim()) {
      filtered = filtered.filter((job) =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Filter by start date
    if (dateFilter) {
      filtered = filtered.filter((job) => job.event_start_date === dateFilter);
    }

    setFilteredJobs(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setDateFilter("");
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-7xl mx-auto">
          {seekerUser ? (
            <SeekerNavbar />
          ) : (
            <div className="flex justify-between items-center mb-10">
              <div className="flex gap-2 md:gap-3">
                <button
                  onClick={() => router.push("/seeker/login")}
                  className="bg-white text-indigo-600 px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl border-2 border-indigo-600 hover:bg-indigo-50 transition-all duration-300 font-semibold text-sm md:text-base"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push("/seeker/signup")}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
                >
                  Sign Up
                </button>
              </div>
            </div>
          )}

          {!seekerUser && (
            <h1 className="text-3xl md:text-4xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Available Event Jobs
            </h1>
          )}

          {/* ✅ SEARCH & FILTERS - Added margin-top for mobile spacing */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 border border-white/20 mb-8 mt-6 md:mt-0">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              🔍 Search & Filter Jobs
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search by Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Title
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

              {/* Filter by Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Start Date
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
            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold text-indigo-600">{filteredJobs.length}</span> jobs
              {(searchQuery || locationFilter || dateFilter) && (
                <span className="ml-2 text-purple-600">(filtered)</span>
              )}
            </div>
          </div>

          {/* ✅ JOBS GRID */}
          {currentJobs.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg p-6 md:p-8 text-center border border-white/20">
              <p className="text-gray-500 mb-4">
                {(searchQuery || locationFilter || dateFilter)
                  ? "No jobs match your filters."
                  : "No active event jobs available."}
              </p>
              {(searchQuery || locationFilter || dateFilter) && (
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
              <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {currentJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/events/${job.id}`}
                    className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-4 md:p-6 border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                      {job.title}
                    </h2>

                    <div className="space-y-2 text-sm md:text-base">
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-indigo-600">🎭</span>
                        <span className="font-medium">Type:</span> {job.event_type}
                      </p>

                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-indigo-600">📍</span>
                        <span className="font-medium">Location:</span> {job.location}
                      </p>

                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-indigo-600">📅</span>
                        <span className="font-medium">Date:</span>{" "}
                        {job.event_start_date === job.event_end_date
                          ? job.event_start_date
                          : `${job.event_start_date} to ${job.event_end_date}`}
                      </p>

                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="text-indigo-600">👥</span>
                        <span className="font-medium">Helpers:</span> {job.helpers_needed}
                      </p>

                      <p className="text-gray-800 font-bold text-base md:text-lg mt-4 flex items-center gap-2">
                        <span className="text-indigo-600">💰</span>
                        {job.payment}
                      </p>
                    </div>
                  </Link>
                ))}
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