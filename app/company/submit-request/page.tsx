"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitRequestPage() {
  const router = useRouter();
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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

    setCompanyUser(parsedUser);
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/job-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: companyUser.id,
          companyName: companyUser.company_name,
          title,
          eventType,
          location,
          helpersNeeded,
          date,
          time,
          paymentOffered,
          description,
          contactPhone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request');
      }

      if (data.success) {
        alert("✅ Job request submitted successfully! Waiting for admin approval.");
        router.push("/company/dashboard");
      }
    } catch (error: any) {
      alert(error.message || 'Failed to submit request');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
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
              disabled={loading}
            />

            <select
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              required
              disabled={loading}
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
              disabled={loading}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />

              <input
                type="time"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <input
              type="text"
              placeholder="Location (City/Area)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="text"
              placeholder="Payment Offered (e.g. ₹2000/day)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={paymentOffered}
              onChange={(e) => setPaymentOffered(e.target.value)}
              required
              disabled={loading}
            />

            <textarea
              placeholder="Job Description / Requirements"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[120px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 resize-none text-gray-800"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="text"
              placeholder="Contact Phone Number"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              disabled={loading}
            />

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Request for Approval'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}