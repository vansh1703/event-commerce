"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Job = {
  id: string;
  title: string;
  event_type: string;
  location: string;
  helpers_needed: number;
  date: string;
  time: string;
  payment: string;
  description: string;
  contact_phone: string;
  archived: boolean;
  completed: boolean;
  custom_fields: any;
  event_start_date: string;
  event_end_date: string;
  event_start_time: string;
  event_end_time: string;
};

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [seekerUser, setSeekerUser] = useState<any>(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  // Basic fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [availability, setAvailability] = useState("");

  // ✅ Custom field states
  const [customData, setCustomData] = useState<any>({});
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    loadJob();
    checkUser();
  }, [jobId]);

  const checkUser = async () => {
    const user = localStorage.getItem("seekerUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setSeekerUser(parsedUser);
      setName(parsedUser.full_name || "");
      setPhone(parsedUser.phone || "");

      await checkIfApplied(parsedUser.id);
    }
  };

  const loadJob = async () => {
    try {
      const res = await fetch("/api/jobs", { method: "GET" });
      const data = await res.json();

      if (data.success) {
        const foundJob = data.jobs.find((j: Job) => j.id === jobId);
        if (foundJob) {
          setJob(foundJob);
        } else {
          alert("Job not found!");
          router.push("/events");
        }
      }
    } catch (error) {
      console.error("Error loading job:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async (seekerId: string) => {
    try {
      const res = await fetch(
        `/api/applications?jobId=${jobId}&seekerId=${seekerId}`,
        { method: "GET" },
      );
      const data = await res.json();

      if (data.success && data.applications.length > 0) {
        setAlreadyApplied(true);
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  // ✅ Handle file upload for custom fields
  const handleFileUpload = async (fieldName: string, file: File) => {
    if (!file || !seekerUser) return;

    setUploadingFiles((prev) => ({ ...prev, [fieldName]: true }));

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${seekerUser.id}/${fieldName}_${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("seeker-documents")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("seeker-documents")
        .getPublicUrl(fileName);

      setCustomData((prev: any) => ({
        ...prev,
        [fieldName]: urlData.publicUrl,
      }));

      alert(`✅ ${fieldName} uploaded successfully!`);
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload ${fieldName}: ${error.message}`);
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  // ✅ Handle text input for custom fields
  const handleCustomTextInput = (fieldName: string, value: string) => {
    setCustomData((prev: any) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!seekerUser) {
      const confirmLogin = window.confirm(
        "Please login to apply for this job. Click OK to go to login page.",
      );
      if (confirmLogin) {
        router.push("/seeker/login");
      }
      return;
    }

    if (alreadyApplied) {
      alert("You have already applied for this job!");
      return;
    }

    if (job?.archived) {
      alert("This job is no longer accepting applications (archived).");
      return;
    }

    if (job?.completed) {
      alert("This job is no longer accepting applications (completed).");
      return;
    }

    // ✅ Validate required custom fields
    if (job?.custom_fields) {
      const requiredFields = Object.entries(job.custom_fields).filter(
        ([_, required]) => required,
      );

      for (const [fieldName] of requiredFields) {
        if (!customData[fieldName]) {
          alert(
            `Please complete the required field: ${getFieldLabel(fieldName)}`,
          );
          return;
        }
      }
    }

    setApplying(true);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: jobId,
          seekerId: seekerUser.id,
          name,
          phone,
          age: parseInt(age),
          city,
          experience,
          availability,
          customData, // ✅ Send custom data
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      if (data.success) {
        alert("Application submitted successfully!");
        router.push("/my-applications");
      }
    } catch (error: any) {
      alert(error.message || "Failed to submit application");
    } finally {
      setApplying(false);
    }
  };

  // ✅ Helper function to get field labels
  const getFieldLabel = (fieldName: string): string => {
    const labels: Record<string, string> = {
      additional_photo: "Additional Photo (Full Body/Other Angle)",
      additional_id_proof: "Additional ID Proof",
      birthmark_photo: "Birthmark/Mole Photo",
      college_name: "College Name",
      highest_qualification: "Highest Qualification & Domain",
      english_fluency: "English Fluency",
      formal_photo: "Photo in Formals",
      profile_photo: "Left/Right Face Profile Photo",
    };
    return labels[fieldName] || fieldName;
  };

  // ✅ Helper function to determine if field is photo type
  const isPhotoField = (fieldName: string): boolean => {
    return [
      "additional_photo",
      "additional_id_proof",
      "birthmark_photo",
      "formal_photo",
      "profile_photo",
    ].includes(fieldName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading job details...
          </p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const canApply = !job.archived && !job.completed && !alreadyApplied;
  const isArchived = job.archived;
  const isCompleted = job.completed;
  const hasCustomFields =
    job.custom_fields &&
    Object.values(job.custom_fields).some((v) => v === true);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 md:px-6 py-6 md:py-10">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/events")}
          className="text-indigo-600 dark:text-indigo-400 hover:text-purple-600 dark:hover:text-purple-400 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Jobs
        </button>

        <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-8 border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {job.title}
            </h1>

            {isArchived && (
              <span className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-3 py-1 rounded-full text-xs font-semibold">
                📦 ARCHIVED
              </span>
            )}
            {isCompleted && (
              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                ✓ COMPLETED
              </span>
            )}
          </div>

          {(isArchived || isCompleted) && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-700 rounded-2xl p-4 mb-6">
              <p className="text-orange-800 dark:text-orange-300 font-semibold text-sm">
                ⚠️ This job is no longer accepting new applications.
              </p>
              <p className="text-orange-700 dark:text-orange-400 text-xs mt-1">
                {isArchived && "The position has been archived by the admin."}
                {isCompleted && "This event has already been completed."}
              </p>
            </div>
          )}

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Event Type
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.event_type}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Location
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.location}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border-2 border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  📅 Event Dates
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.event_start_date === job.event_end_date
                    ? job.event_start_date
                    : `${job.event_start_date} to ${job.event_end_date}`}
                </p>
              </div>

              {/* ✅ TIME RANGE DISPLAY */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-2xl p-4 border-2 border-purple-200 dark:border-purple-700">
                <p className="text-sm text-purple-600 dark:text-purple-400 mb-1">
                  🕐 Event Time
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.event_start_time === job.event_end_time
                    ? job.event_start_time
                    : `${job.event_start_time} - ${job.event_end_time}`}
                </p>
              </div>

              {/* <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Date & Time
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.date} at {job.time}
                </p>
              </div> */}
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Helpers Needed
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.helpers_needed}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Payment
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.payment}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Contact
                </p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {job.contact_phone}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Description
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                {job.description}
              </p>
            </div>
          </div>

          {alreadyApplied ? (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700 rounded-2xl p-6 text-center">
              <p className="text-green-800 dark:text-green-300 font-semibold text-lg mb-2">
                ✓ Already Applied
              </p>
              <p className="text-green-600 dark:text-green-400">
                You have already applied for this job.
              </p>
              <button
                onClick={() => router.push("/my-applications")}
                className="mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
              >
                View My Applications
              </button>
            </div>
          ) : !canApply ? (
            <div className="bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                This job is no longer accepting applications.
              </p>
              <button
                onClick={() => router.push("/events")}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg"
              >
                Browse Other Jobs
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
                Apply for this Job
              </h2>

              <form onSubmit={handleApply} className="space-y-5">
                {/* Basic Fields */}
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={!!seekerUser || applying}
                />

                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={!!seekerUser || applying}
                />

                <input
                  type="number"
                  placeholder="Age"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  disabled={applying}
                />

                <input
                  type="text"
                  placeholder="City"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  disabled={applying}
                />

                <textarea
                  placeholder="Your Experience (if any)"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl min-h-[100px] bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none text-gray-800 dark:text-gray-200"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  required
                  disabled={applying}
                />

                <input
                  type="text"
                  placeholder="Availability (e.g., Full Day, Morning Only)"
                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-4 rounded-2xl bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-800 dark:text-gray-200"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  required
                  disabled={applying}
                />

                {/* ✅ DYNAMIC CUSTOM FIELDS */}
                {hasCustomFields && (
                  <div className="border-t-2 border-gray-200 dark:border-gray-600 pt-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                      <span className="text-purple-600">📋</span>
                      Additional Required Information
                    </h3>

                    <div className="space-y-4 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-2xl">
                      {Object.entries(job.custom_fields).map(
                        ([fieldName, isRequired]) => {
                          if (!isRequired) return null;

                          const label = getFieldLabel(fieldName);
                          const isPhoto = isPhotoField(fieldName);

                          return (
                            <div
                              key={fieldName}
                              className="bg-white dark:bg-gray-700 p-4 rounded-xl"
                            >
                              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {label} <span className="text-red-500">*</span>
                              </label>

                              {isPhoto ? (
                                <div className="space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file)
                                        handleFileUpload(fieldName, file);
                                    }}
                                    disabled={
                                      applying || uploadingFiles[fieldName]
                                    }
                                    className="w-full text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-900 dark:file:text-indigo-300"
                                    required
                                  />
                                  {uploadingFiles[fieldName] && (
                                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                      Uploading...
                                    </p>
                                  )}
                                  {customData[fieldName] && (
                                    <p className="text-sm text-green-600 dark:text-green-400">
                                      ✓ Uploaded successfully
                                    </p>
                                  )}
                                </div>
                              ) : fieldName === "english_fluency" ? (
                                <div className="space-y-2">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={customData[fieldName]?.includes(
                                        "Reading",
                                      )}
                                      onChange={(e) => {
                                        const current =
                                          customData[fieldName] || "";
                                        const values = current
                                          .split(", ")
                                          .filter((v: string) => v);
                                        if (e.target.checked) {
                                          values.push("Reading");
                                        } else {
                                          const index =
                                            values.indexOf("Reading");
                                          if (index > -1)
                                            values.splice(index, 1);
                                        }
                                        handleCustomTextInput(
                                          fieldName,
                                          values.join(", "),
                                        );
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Reading
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={customData[fieldName]?.includes(
                                        "Writing",
                                      )}
                                      onChange={(e) => {
                                        const current =
                                          customData[fieldName] || "";
                                        const values = current
                                          .split(", ")
                                          .filter((v: string) => v);
                                        if (e.target.checked) {
                                          values.push("Writing");
                                        } else {
                                          const index =
                                            values.indexOf("Writing");
                                          if (index > -1)
                                            values.splice(index, 1);
                                        }
                                        handleCustomTextInput(
                                          fieldName,
                                          values.join(", "),
                                        );
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Writing
                                    </span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={customData[fieldName]?.includes(
                                        "Understanding",
                                      )}
                                      onChange={(e) => {
                                        const current =
                                          customData[fieldName] || "";
                                        const values = current
                                          .split(", ")
                                          .filter((v: string) => v);
                                        if (e.target.checked) {
                                          values.push("Understanding");
                                        } else {
                                          const index =
                                            values.indexOf("Understanding");
                                          if (index > -1)
                                            values.splice(index, 1);
                                        }
                                        handleCustomTextInput(
                                          fieldName,
                                          values.join(", "),
                                        );
                                      }}
                                      className="w-4 h-4 text-indigo-600 rounded"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                      Understanding
                                    </span>
                                  </label>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder={`Enter ${label}`}
                                  value={customData[fieldName] || ""}
                                  onChange={(e) =>
                                    handleCustomTextInput(
                                      fieldName,
                                      e.target.value,
                                    )
                                  }
                                  disabled={applying}
                                  className="w-full border-2 border-gray-200 dark:border-gray-600 p-3 rounded-xl bg-white dark:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 dark:text-gray-200"
                                  required
                                />
                              )}
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}

                <button
                  disabled={applying}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {applying ? "Submitting..." : "Submit Application"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
