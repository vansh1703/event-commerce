"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SeekerNavbar from "@/components/navbar/SeekerNavbar";

type Application = {
  jobId: string;
  name: string;
  phone: string;
  appliedAt: string;
  status: "pending" | "accepted" | "rejected";
};

type Job = {
  id: string;
  title: string;
  eventType: string;
  location: string;
  payment: string;
  date: string;
  completed?: boolean;
};

type Rating = {
  stars: number;
  jobTitle: string;
  date: string;
};

type RedFlag = {
  date: string;
  reason: string;
  jobTitle: string;
};

type CompletedEvent = {
  job: Job;
  application: Application;
  rating?: Rating;
  redFlag?: RedFlag;
};

export default function CompletedEventsPage() {
  const router = useRouter();
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([]);
  const [seekerUser, setSeekerUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("seekerUser");

    if (!storedUser) {
      router.push("/seeker/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setSeekerUser(parsedUser);

    // Load data
    const allApplications: Application[] = JSON.parse(
      localStorage.getItem("applications") || "[]"
    );
    const jobs: Job[] = JSON.parse(localStorage.getItem("jobs") || "[]");
    const seekerAccounts = JSON.parse(
      localStorage.getItem("seekerAccounts") || "[]"
    );

    const profile = seekerAccounts.find(
      (acc: any) => acc.name === parsedUser.name
    );

    // Get completed events where user was accepted
    const completed: CompletedEvent[] = allApplications
      .filter(
        (app) =>
          app.name === parsedUser.name && app.status === "accepted"
      )
      .map((app) => {
        const job = jobs.find((j) => j.id === app.jobId);
        if (!job) return null;

        const isCompleted =
          job.completed || new Date(job.date) < new Date();
        if (!isCompleted) return null;

        // Find rating for this job
        const rating = profile?.ratings?.find(
          (r: Rating) => r.jobTitle === job.title
        );

        // Find red flag for this job
        const redFlag = profile?.redFlags?.find(
          (f: RedFlag) => f.jobTitle === job.title
        );

        // Return properly typed object
        const completedEvent: CompletedEvent = {
          job,
          application: app,
          rating: rating || undefined,
          redFlag: redFlag || undefined,
        };

        return completedEvent;
      })
      .filter((e): e is CompletedEvent => e !== null);

    setCompletedEvents(completed);
  }, [router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-5xl mx-auto">
        <SeekerNavbar />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Completed Events
          </h1>

          <button
            onClick={() => router.push("/my-applications")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
          >
            Active Applications
          </button>
        </div>

        {completedEvents.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-8 text-center border border-gray-100">
            <p className="text-gray-500 mb-4">
              You haven't completed any events yet.
            </p>
            <button
              onClick={() => router.push("/events")}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
            >
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {completedEvents.map((event, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100"
              >
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                      {event.job.title}
                    </h2>
                    <div className="space-y-1 text-sm md:text-base">
                      <p className="text-gray-600">
                        <span className="font-medium">Type:</span>{" "}
                        {event.job.eventType}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span>{" "}
                        {event.job.location}
                      </p>
                      <p className="text-gray-600">
                        <span className="font-medium">Date:</span>{" "}
                        {event.job.date}
                      </p>
                      <p className="text-gray-800 font-bold">
                        <span className="font-medium">Payment:</span>{" "}
                        {event.job.payment}
                      </p>
                    </div>
                  </div>

                  {/* Rating or Red Flag Badge */}
                  <div className="flex-shrink-0">
                    {event.redFlag ? (
                      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg">
                        🚩 Red Flag
                      </div>
                    ) : event.rating ? (
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base shadow-lg flex items-center gap-2">
                        <span className="text-xl">⭐</span>
                        {event.rating.stars}/5
                      </div>
                    ) : (
                      <div className="bg-gray-300 text-gray-700 px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold text-sm md:text-base">
                        No Review
                      </div>
                    )}
                  </div>
                </div>

                {/* Red Flag Details */}
                {event.redFlag && (
                  <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                    <p className="text-red-800 font-semibold mb-1">
                      Red Flag Reason:
                    </p>
                    <p className="text-red-700">{event.redFlag.reason}</p>
                    <p className="text-red-600 text-sm mt-2">
                      Flagged on: {event.redFlag.date}
                    </p>
                  </div>
                )}

                {/* Rating Display */}
                {event.rating && (
                  <div className="mt-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                    <p className="text-yellow-800 font-semibold mb-2">
                      Performance Rating:
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-3xl ${
                            star <= event.rating!.stars
                              ? "text-yellow-500"
                              : "text-gray-300"
                          }`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <p className="text-yellow-700 text-sm mt-2">
                      Rated on: {event.rating.date}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}