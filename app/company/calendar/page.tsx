"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiCall } from "@/lib/api";
import EventCalendar from "@/components/EventCalendar";
import CompanySidebar from "@/components/CompanySidebar";

type Job = {
  id: string;
  company_id: string;
  title: string;
  event_type: string;
  location: string;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
  helpers_needed: number;
  payment: string;
  completed: boolean;
};

export default function CompanyCalendarPage() {
  const router = useRouter();
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [approvedJobs, setApprovedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "company") {
      router.push("/auth/login");
      return;
    }

    setCompanyUser(parsedUser);
    await loadJobs(parsedUser.id);
  };

  const loadJobs = async (companyId: string) => {
    try {
      const jobsData = await apiCall("/jobs", { method: "GET" });
      if (jobsData.success) {
        const myJobs = jobsData.jobs.filter(
          (job: Job) => job.company_id === companyId
        );

        const active = myJobs.filter(
          (job: Job) =>
            !job.completed && new Date(job.event_end_date) >= new Date()
        );

        setApprovedJobs(active);
      }
    } catch (error) {
      console.error("Error loading jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!companyUser) return null;

  return (
    <>
    <CompanySidebar
        companyName={companyUser.company_name}
        companyId={companyUser.id}
    />
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Event Calendar</h1>
            <p className="text-gray-600 mt-2">
              View all your scheduled events in calendar view
            </p>
          </div>

          {approvedJobs.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-lg p-8 text-center">
              <p className="text-gray-500 mb-4">
                No active events yet. Submit a job request to get started!
              </p>
              <button
                onClick={() => router.push("/company/submit-request")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
              >
                Submit Job Request
              </button>
            </div>
          ) : (
            <EventCalendar jobs={approvedJobs} />
          )}
        </div>
      </main>
    </div>
    </>
  );
}