"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitRequestPage() {
  const router = useRouter();
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyName, setCompanyName] = useState("");

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [helpersNeeded, setHelpersNeeded] = useState<number>(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [paymentOffered, setPaymentOffered] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");

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
    setCompanyName(parsedUser.companyName);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newRequest = {
      id: Date.now().toString(),
      companyEmail,
      companyName,
      title,
      eventType,
      helpersNeeded,
      date,
      time,
      location,
      paymentOffered,
      description,
      contactPhone,
      status: "pending" as const,
      submittedAt: new Date().toLocaleDateString(),
    };

    const oldRequests = JSON.parse(localStorage.getItem("jobRequests") || "[]");
    localStorage.setItem("jobRequests", JSON.stringify([...oldRequests, newRequest]));

    alert("✅ Job request submitted successfully! Waiting for admin approval.");
    router.push("/company/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/company/dashboard")}
          className="text-indigo-600 hover:text-purple-600 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Submit Job Request
          </h1>
          <p className="text-gray-600 mb-8">
            Fill out the form below. Admin will review and post your job.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="Event Title (e.g. Wedding Helpers Needed)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <select
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              required
            >
              <option value="">Select Event Type</option>
              <option value="Wedding">Wedding</option>
              <option value="Birthday">Birthday</option>
              <option value="Party">Party</option>
              <option value="Corporate">Corporate Event</option>
              <option value="Conference">Conference</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              min={1}
              placeholder="Number of Helpers Needed"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={helpersNeeded}
              onChange={(e) => setHelpersNeeded(Number(e.target.value))}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <input
                type="time"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>

            <input
              type="text"
              placeholder="Location (City/Area)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Payment Offered (e.g. ₹2000/day)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={paymentOffered}
              onChange={(e) => setPaymentOffered(e.target.value)}
              required
            />

            <textarea
              placeholder="Job Description / Requirements"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Contact Phone Number"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
            />

            <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
              Submit Request for Approval
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}