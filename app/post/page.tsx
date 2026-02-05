"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PostJobPage() {
  const router = useRouter();

  const [posterEmail, setPosterEmail] = useState("");

  // Form Fields
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [helpersNeeded, setHelpersNeeded] = useState<number>(1);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [payment, setPayment] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // ✅ Protect Page
  useEffect(() => {
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);
    setPosterEmail(parsedUser.email);
  }, [router]);

  // ✅ Handle Submit
  const handlePostJob = (e: React.FormEvent) => {
    e.preventDefault();

    const newJob = {
      id: Date.now().toString(),
      title,
      eventType,
      helpersNeeded,
      date,
      time,
      location,
      payment,
      description,
      contactPhone,
      createdBy: posterEmail,
    };

    // Load old jobs
    const oldJobs = JSON.parse(localStorage.getItem("jobs") || "[]");

    // Save updated jobs
    localStorage.setItem("jobs", JSON.stringify([...oldJobs, newJob]));

    alert("Event Requirement Posted Successfully!");

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Post an Event Requirement
        </h1>

        <form onSubmit={handlePostJob} className="space-y-5">
          {/* Title */}
          <input
            type="text"
            placeholder="Event Title (e.g. Wedding Helpers Needed)"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {/* Event Type */}
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
          </select>

          {/* Helpers Needed */}
          <input
            type="number"
            min={1}
            placeholder="Number of Helpers Needed"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
            value={helpersNeeded}
            onChange={(e) => setHelpersNeeded(Number(e.target.value))}
            required
          />

          {/* Date + Time */}
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

          {/* Location */}
          <input
            type="text"
            placeholder="Location (City/Area)"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />

          {/* Payment */}
          <input
            type="text"
            placeholder="Payment Offered (e.g. ₹800/day)"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
            value={payment}
            onChange={(e) => setPayment(e.target.value)}
            required
          />

          {/* Description */}
          <textarea
            placeholder="Extra Notes / Description"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {/* Contact Phone */}
          <input
            type="text"
            placeholder="Contact Phone Number"
            className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            required
          />

          {/* Submit */}
          <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
            Post Requirement
          </button>
        </form>
      </div>
    </main>
  );
}