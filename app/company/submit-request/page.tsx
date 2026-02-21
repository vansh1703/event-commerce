"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Dialog from "@/components/ui/Dialog";
import { useDialog } from "@/hooks/useDialog";

export default function SubmitRequestPage() {
  const router = useRouter();
  const dialog = useDialog();
  
  const [companyUser, setCompanyUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("");
  const [helpersNeeded, setHelpersNeeded] = useState<number>(1);

  // Date range fields
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const [location, setLocation] = useState("");
  const [paymentOffered, setPaymentOffered] = useState("");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [otherEventType, setOtherEventType] = useState("");

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

  // ✅ Validation States
  const [titleError, setTitleError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [helpersError, setHelpersError] = useState("");
  const [otherEventError, setOtherEventError] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      dialog.showWarning(
        "Login Required",
        "Please login to submit a job request"
      );
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type === "superadmin") {
      router.push("/superadmin/dashboard");
      return;
    }

    setCompanyUser(parsedUser);
  }, [router]);

  // ✅ VALIDATION FUNCTIONS

  // Validate Title (no numbers, min 5 chars)
  const validateTitle = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setTitleError("Event title is required");
      return false;
    }

    if (trimmed.length < 5) {
      setTitleError("Title must be at least 5 characters long");
      return false;
    }

    // Check if it's too generic
    const genericTitles = ["event", "job", "work", "help", "helper"];
    if (genericTitles.includes(trimmed.toLowerCase())) {
      setTitleError("Please provide a more specific title");
      return false;
    }

    setTitleError("");
    return true;
  };

  // Validate Location (no numbers, alphabets and spaces only)
  const validateLocation = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setLocationError("Location is required");
      return false;
    }

    if (trimmed.length < 3) {
      setLocationError("Location must be at least 3 characters");
      return false;
    }

    // Check if contains numbers
    if (/\d/.test(trimmed)) {
      setLocationError("Location should not contain numbers");
      return false;
    }

    // Only letters, spaces, commas, and hyphens
    const locationRegex = /^[a-zA-Z\s,\-]+$/;
    if (!locationRegex.test(trimmed)) {
      setLocationError("Location should only contain letters, spaces, commas, and hyphens");
      return false;
    }

    setLocationError("");
    return true;
  };

  // Validate Payment Offered (should contain numbers and currency symbol)
  const validatePayment = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setPaymentError("Payment offered is required");
      return false;
    }

    // Must contain at least one number
    if (!/\d/.test(trimmed)) {
      setPaymentError("Payment must include an amount (e.g., ₹2000/day)");
      return false;
    }

    // Extract numbers to check if they're reasonable
    const numbers = trimmed.match(/\d+/g);
    if (numbers) {
      const amount = parseInt(numbers.join(""));
      if (amount < 100) {
        setPaymentError("Payment seems too low. Please verify.");
        return false;
      }
      if (amount > 100000) {
        setPaymentError("Payment seems unusually high. Please verify.");
        return false;
      }
    }

    setPaymentError("");
    return true;
  };

  // Validate Phone (Indian format: 10 digits)
  const validatePhone = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setPhoneError("Contact phone is required");
      return false;
    }

    // Remove spaces, dashes, and +91
    const cleaned = trimmed.replace(/[\s\-+]/g, "").replace(/^91/, "");

    // Check if it's exactly 10 digits
    const phoneRegex = /^[6-9]\d{9}$/;
    
    if (!phoneRegex.test(cleaned)) {
      if (cleaned.length !== 10) {
        setPhoneError("Phone number must be exactly 10 digits");
      } else if (!/^[6-9]/.test(cleaned)) {
        setPhoneError("Phone number must start with 6, 7, 8, or 9");
      } else {
        setPhoneError("Please enter a valid phone number");
      }
      return false;
    }

    setPhoneError("");
    return true;
  };

  // Validate Helpers Needed
  const validateHelpers = (value: number): boolean => {
    if (value < 1) {
      setHelpersError("At least 1 helper is required");
      return false;
    }

    if (value > 100) {
      setHelpersError("Number of helpers seems too high. Please verify.");
      return false;
    }

    setHelpersError("");
    return true;
  };

  // Validate Other Event Type
  const validateOtherEvent = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setOtherEventError("Please describe the event type");
      return false;
    }

    if (trimmed.length < 3) {
      setOtherEventError("Description must be at least 3 characters");
      return false;
    }

    setOtherEventError("");
    return true;
  };

  // ✅ Handle input changes with validation
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim()) validateTitle(value);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim()) validateLocation(value);
  };

  const handlePaymentChange = (value: string) => {
    setPaymentOffered(value);
    if (value.trim()) validatePayment(value);
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers, spaces, dashes, and + sign
    const filtered = value.replace(/[^\d\s\-+]/g, "");
    setContactPhone(filtered);
    if (filtered.trim()) validatePhone(filtered);
  };

  const handleHelpersChange = (value: number) => {
    setHelpersNeeded(value);
    validateHelpers(value);
  };

  const handleOtherEventChange = (value: string) => {
    setOtherEventType(value);
    if (value.trim()) validateOtherEvent(value);
  };

  // Auto-set end date when start date changes
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    if (!endDate) {
      setEndDate(date);
    }
  };

  // Auto-set end time when start time changes
  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (!endTime) {
      setEndTime(time);
    }
  };

  const toggleCustomField = (field: keyof typeof customFields) => {
    setCustomFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate all fields
    const isTitleValid = validateTitle(title);
    const isLocationValid = validateLocation(location);
    const isPaymentValid = validatePayment(paymentOffered);
    const isPhoneValid = validatePhone(contactPhone);
    const isHelpersValid = validateHelpers(helpersNeeded);

    // Validate "Other" event type if selected
    let isOtherEventValid = true;
    if (eventType === "Other") {
      isOtherEventValid = validateOtherEvent(otherEventType);
    }

    if (!isTitleValid || !isLocationValid || !isPaymentValid || !isPhoneValid || !isHelpersValid || !isOtherEventValid) {
      dialog.showWarning(
        "Validation Error",
        "Please fix all errors before submitting"
      );
      return;
    }

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      dialog.showError(
        "Invalid Date Range",
        "End date cannot be before start date"
      );
      return;
    }

    // Check if start date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(startDate) < today) {
      dialog.showWarning(
        "Past Date Selected",
        "Event start date cannot be in the past"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: companyUser.id,
          companyName: companyUser.company_name,
          title,
          eventType: eventType === "Other" ? `Other: ${otherEventType}` : eventType,
          location,
          helpersNeeded,
          startDate,
          endDate,
          startTime,
          endTime,
          paymentOffered,
          description,
          contactPhone,
          customFields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      if (data.success) {
        dialog.showSuccess(
          "Request Submitted!",
          "Your job request has been submitted successfully. Admin will review and post it soon."
        );
        setTimeout(() => router.push("/company/dashboard"), 2000);
      }
    } catch (error: any) {
      dialog.showError(
        "Submission Failed",
        error.message || "Failed to submit request. Please try again."
      );
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
              {/* ✅ Event Title with Validation */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">📝</span>
                  Event Title
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="e.g., Wedding Helpers Needed for Grand Celebration"
                  className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 ${
                    titleError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:ring-blue-400"
                  }`}
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  onBlur={() => title && validateTitle(title)}
                  required
                  disabled={loading}
                />
                {titleError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {titleError}</p>
                )}
                {!titleError && title && title.length >= 5 && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Good title!</p>
                )}
              </div>

              {/* Event Type */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">🎉</span>
                  Event Type
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <select
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 dark:text-gray-200"
                  value={eventType}
                  onChange={(e) => {
                    setEventType(e.target.value);
                    if (e.target.value !== "Other") {
                      setOtherEventType("");
                      setOtherEventError("");
                    }
                  }}
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

                {/* Other Event Type Input */}
                {eventType === "Other" && (
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="e.g., Product Launch, Festival, Charity Event"
                      className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all text-gray-800 dark:text-gray-200 ${
                        otherEventError
                          ? "border-red-300 focus:ring-red-400"
                          : "border-gray-200 dark:border-gray-600 focus:ring-purple-400"
                      }`}
                      value={otherEventType}
                      onChange={(e) => handleOtherEventChange(e.target.value)}
                      onBlur={() => otherEventType && validateOtherEvent(otherEventType)}
                      required
                      disabled={loading}
                    />
                    {otherEventError && (
                      <p className="text-red-500 text-sm mt-2 ml-2">❌ {otherEventError}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Helpers Needed */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">👥</span>
                  Number of Helpers Needed
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="e.g., 5"
                  className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 ${
                    helpersError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:ring-green-400"
                  }`}
                  value={helpersNeeded}
                  onChange={(e) => handleHelpersChange(Number(e.target.value))}
                  required
                  disabled={loading}
                />
                {helpersError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {helpersError}</p>
                )}
              </div>

              {/* Date Range Section */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <span className="text-xl">📅</span>
                  Event Date & Time Range
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
                      min={new Date().toISOString().split('T')[0]}
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

                <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                  💡 For single-day events, start and end dates will be the same
                </p>
              </div>

              {/* Location with Validation */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Location
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="e.g., Connaught Place, New Delhi"
                  className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 ${
                    locationError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:ring-orange-400"
                  }`}
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onBlur={() => location && validateLocation(location)}
                  required
                  disabled={loading}
                />
                {locationError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {locationError}</p>
                )}
                {!locationError && location && location.length >= 3 && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid location!</p>
                )}
              </div>

              {/* Payment with Validation */}
              <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  Payment Offered
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="e.g., ₹2000/day or ₹500/hour"
                  className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 ${
                    paymentError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:ring-green-400"
                  }`}
                  value={paymentOffered}
                  onChange={(e) => handlePaymentChange(e.target.value)}
                  onBlur={() => paymentOffered && validatePayment(paymentOffered)}
                  required
                  disabled={loading}
                />
                {paymentError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {paymentError}</p>
                )}
                {!paymentError && paymentOffered && /\d/.test(paymentOffered) && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid payment format!</p>
                )}
              </div>

              {/* Description */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">📄</span>
                  Job Description
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <textarea
                  placeholder="Describe the job requirements, responsibilities, and any special instructions..."
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-xl min-h-[120px] bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none text-gray-800 dark:text-gray-200"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {description.length}/500 characters
                </p>
              </div>

              {/* Contact Phone with Validation */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 border-2 border-pink-200 dark:border-pink-700 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-xl">📞</span>
                  Contact Phone Number
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  className={`w-full border-2 p-4 rounded-xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200 ${
                    phoneError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-600 focus:ring-pink-400"
                  }`}
                  value={contactPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => contactPhone && validatePhone(contactPhone)}
                  required
                  disabled={loading}
                  maxLength={15}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {phoneError}</p>
                )}
                {!phoneError && contactPhone && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid phone number!</p>
                )}
              </div>

              {/* Custom Fields Section (keep same) */}
              <div className="border-t-2 border-gray-200 dark:border-gray-600 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCustomFields(!showCustomFields)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  {showCustomFields ? "➖" : "➕"} Add Additional Fields for Job Seekers
                </button>

                {showCustomFields && (
                  <div className="mt-6 space-y-3 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl">
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 font-semibold">
                      Select additional information you want from job seekers:
                    </p>

                    {Object.entries({
                      additional_photo: "📸 Additional Photo (Full Body/Other Angle)",
                      additional_id_proof: "🆔 Additional ID Proof",
                      birthmark_photo: "⚫ Birthmark/Mole Photo (Field Verification)",
                      college_name: "🎓 College Name",
                      highest_qualification: "📚 Highest Qualification & Domain",
                      english_fluency: "🗣️ English Fluency (Reading, Writing, Understanding)",
                      formal_photo: "👔 Photo in Formals",
                      profile_photo: "📷 Left/Right Face Profile Photo",
                    }).map(([key, label]) => (
                      <label
                        key={key}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-purple-100 dark:hover:bg-gray-600 transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={customFields[key as keyof typeof customFields]}
                          onChange={() => toggleCustomField(key as keyof typeof customFields)}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-400"
                        />
                        <span className="text-gray-800 dark:text-gray-200">{label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                disabled={loading || !!titleError || !!locationError || !!paymentError || !!phoneError || !!helpersError}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Submitting...
                  </span>
                ) : (
                  'Submit Request for Approval'
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Dialog Component */}
      <Dialog
        isOpen={dialog.isOpen}
        onClose={dialog.closeDialog}
        title={dialog.config.title}
        message={dialog.config.message}
        type={dialog.config.type}
        confirmText={dialog.config.confirmText}
        cancelText={dialog.config.cancelText}
        onConfirm={dialog.config.onConfirm}
        showCancel={dialog.config.showCancel}
      />
    </>
  );
}