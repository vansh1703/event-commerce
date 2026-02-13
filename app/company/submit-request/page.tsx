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
  
  // ✅ DATE RANGE FIELDS
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  
  const [location, setLocation] = useState("");
  const [paymentOffered, setPaymentOffered] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Custom fields state
  const [showCustomFields, setShowCustomFields] = useState(false);
  const [customFields, setCustomFields] = useState({
    additional_photo: false,
    additional_id_proof: false,
    birthmark_photo: false,
    college_name: false,
    highest_qualification: false,
    english_fluency: false,
    formal_photo: false,
    profile_photo: false,
  });

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

  // ✅ Auto-set end date when start date changes (for single day events)
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (!endDate) {
      setEndDate(date); // Auto-fill end date same as start
    }
  };

  // ✅ Auto-set end time when start time changes
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (!endTime) {
      setEndTime(time); // Auto-fill end time same as start
    }
  };

  const toggleCustomField = (field: keyof typeof customFields) => {
    setCustomFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      alert("End date cannot be before start date!");
      return;
    }

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
          startDate,      // ✅ Send date range
          endDate,        // ✅ Send date range
          startTime,      // ✅ Send time range
          endTime,        // ✅ Send time range
          paymentOffered,
          description,
          contactPhone,
          customFields,
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
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/company/dashboard")}
          className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Submit Job Request
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Fill out the form below. Admin will review and post your job.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <input
              type="text"
              placeholder="Event Title (e.g. Wedding Helpers Needed)"
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={loading}
            />

            <select
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-gray-800 dark:text-gray-200"
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
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              value={helpersNeeded}
              onChange={(e) => setHelpersNeeded(Number(e.target.value))}
              required
              disabled={loading}
            />

            {/* ✅ DATE RANGE SECTION */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                📅 Event Date & Time Range
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-gray-200"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-gray-200"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-gray-200"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-gray-200"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 For single-day events, start and end dates will be the same
              </p>
            </div>

            <input
              type="text"
              placeholder="Location (City/Area)"
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="text"
              placeholder="Payment Offered (e.g. ₹2000/day)"
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              value={paymentOffered}
              onChange={(e) => setPaymentOffered(e.target.value)}
              required
              disabled={loading}
            />

            <textarea
              placeholder="Job Description / Requirements"
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl min-h-[120px] bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none text-gray-800 dark:text-gray-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="text"
              placeholder="Contact Phone Number"
              className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              required
              disabled={loading}
            />

            {/* CUSTOM FIELDS SECTION (keeping same as before) */}
            <div className="border-t-2 border-gray-200 dark:border-gray-600 pt-6">
              <button
                type="button"
                onClick={() => setShowCustomFields(!showCustomFields)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg flex items-center justify-center gap-2"
              >
                {showCustomFields ? '➖' : '➕'} Add Additional Fields for Job Seekers
              </button>

              {showCustomFields && (
                <div className="mt-6 space-y-3 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 font-semibold">
                    Select additional information you want from job seekers:
                  </p>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.additional_photo}
                      onChange={() => toggleCustomField('additional_photo')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">📸 Additional Photo (Full Body/Other Angle)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.additional_id_proof}
                      onChange={() => toggleCustomField('additional_id_proof')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">🆔 Additional ID Proof</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.birthmark_photo}
                      onChange={() => toggleCustomField('birthmark_photo')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">⚫ Birthmark/Mole Photo (Field Verification)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.college_name}
                      onChange={() => toggleCustomField('college_name')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">🎓 College Name</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.highest_qualification}
                      onChange={() => toggleCustomField('highest_qualification')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">📚 Highest Qualification & Domain</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.english_fluency}
                      onChange={() => toggleCustomField('english_fluency')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">🗣️ English Fluency (Reading, Writing, Understanding)</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.formal_photo}
                      onChange={() => toggleCustomField('formal_photo')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">👔 Photo in Formals</span>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all">
                    <input
                      type="checkbox"
                      checked={customFields.profile_photo}
                      onChange={() => toggleCustomField('profile_photo')}
                      className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                    />
                    <span className="text-gray-800 dark:text-gray-200">📷 Left/Right Face Profile Photo</span>
                  </label>
                </div>
              )}
            </div>

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