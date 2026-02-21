"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Dialog from "@/components/ui/Dialog";
import { useDialog } from "@/hooks/useDialog";

export default function SeekerSignupPage() {
  const router = useRouter();
  const dialog = useDialog();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idProofPhoto, setIdProofPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Preview URLs
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [idProofPreview, setIdProofPreview] = useState<string>("");

  // ✅ Validation States
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "medium" | "strong" | ""
  >("");
  const [passwordError, setPasswordError] = useState("");

  // ✅ VALIDATION FUNCTIONS

  // Validate Name (at least 2 words, only letters and spaces)
  const validateName = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setNameError("Name is required");
      return false;
    }

    // Check if contains at least 2 words (first name + last name)
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      setNameError("Please enter your full name (first and last name)");
      return false;
    }

    // Check if contains only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(trimmed)) {
      setNameError("Name should only contain letters and spaces");
      return false;
    }

    // Check minimum length per word
    const hasShortWord = words.some((word) => word.length < 2);
    if (hasShortWord) {
      setNameError("Each name should be at least 2 characters long");
      return false;
    }

    setNameError("");
    return true;
  };

  // ✅ FIXED: Validate Email
  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setEmailError("Email is required");
      return false;
    }

    // Email regex pattern
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    // Check for common typos (FIXED: exact match check)
    const domain = trimmed.split("@")[1]?.toLowerCase();

    if (domain) {
      // Check for specific typos (not substrings!)
      const typos = {
        "gmial.com": "gmail.com",
        "gmai.com": "gmail.com",
        "gmil.com": "gmail.com",
        "yahooo.com": "yahoo.com",
        "yaho.com": "yahoo.com",
        "outlok.com": "outlook.com",
        "hotmial.com": "hotmail.com",
      };

      if (typos[domain as keyof typeof typos]) {
        setEmailError(`Did you mean ${typos[domain as keyof typeof typos]}?`);
        return false;
      }
    }

    setEmailError("");
    return true;
  };

  // Validate Phone (Indian format: 10 digits)
  const validatePhone = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setPhoneError("Phone number is required");
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

  // Check Password Strength
  const checkPasswordStrength = (
    value: string,
  ): "weak" | "medium" | "strong" => {
    let strength = 0;

    // Length check
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;

    // Complexity checks
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++; // Mixed case
    if (/\d/.test(value)) strength++; // Contains number
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++; // Contains special char

    if (strength <= 2) return "weak";
    if (strength <= 3) return "medium";
    return "strong";
  };

  // Validate Password
  const validatePassword = (value: string): boolean => {
    if (value.length === 0) {
      setPasswordError("Password is required");
      setPasswordStrength("");
      return false;
    }

    if (value.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setPasswordStrength("weak");
      return false;
    }

    const strength = checkPasswordStrength(value);
    setPasswordStrength(strength);

    if (strength === "weak") {
      setPasswordError(
        "Password is too weak. Add uppercase, numbers, and special characters",
      );
      return false;
    }

    setPasswordError("");
    return true;
  };

  // ✅ Handle input changes with validation
  const handleNameChange = (value: string) => {
    setName(value);
    if (value.trim()) validateName(value);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim()) validateEmail(value);
  };

  const handlePhoneChange = (value: string) => {
    // Only allow numbers, spaces, dashes, and + sign
    const filtered = value.replace(/[^\d\s\-+]/g, "");
    setPhone(filtered);
    if (filtered.trim()) validatePhone(filtered);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) validatePassword(value);
  };

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dialog.showError(
          "File Too Large",
          "Profile photo must be less than 5MB",
        );
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        dialog.showError(
          "Invalid File Type",
          "Please upload an image file (JPG, PNG, etc.)",
        );
        return;
      }

      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        dialog.showError("File Too Large", "ID proof must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        dialog.showError(
          "Invalid File Type",
          "Please upload an image file (JPG, PNG, etc.)",
        );
        return;
      }

      setIdProofPhoto(file);
      setIdProofPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("seeker-documents")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from("seeker-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate all fields before submission
    const isNameValid = validateName(name);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid) {
      dialog.showWarning(
        "Validation Error",
        "Please fix all errors before submitting",
      );
      return;
    }

    if (!profilePhoto || !idProofPhoto) {
      dialog.showWarning(
        "Missing Documents",
        "Please upload both profile photo and ID proof",
      );
      return;
    }

    setLoading(true);

    try {
      // Upload profile photo
      console.log("Uploading profile photo...");
      const profilePhotoUrl = await uploadFile(profilePhoto, "profiles");

      // Upload ID proof
      console.log("Uploading ID proof...");
      const idProofPhotoUrl = await uploadFile(idProofPhoto, "id-proofs");

      console.log("Photos uploaded successfully");

      // Create user account
      const res = await fetch("/api/auth/seeker/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          profilePhoto: profilePhotoUrl,
          idProofPhoto: idProofPhotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      if (data.success) {
        dialog.showSuccess(
          "Signup Successful!",
          "Your account has been created. Please login to continue.",
        );
        setTimeout(() => router.push("/seeker/login"), 2000);
      }
    } catch (error: any) {
      dialog.showError(
        "Signup Failed",
        error.message || "An error occurred during signup. Please try again.",
      );
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "strong":
        return "bg-green-500";
      default:
        return "bg-gray-200";
    }
  };

  // ✅ Get password strength width
  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak":
        return "33%";
      case "medium":
        return "66%";
      case "strong":
        return "100%";
      default:
        return "0%";
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
            <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Job Seeker Signup
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Create your account to start finding jobs
            </p>

            <form onSubmit={handleSignup} className="space-y-5">
              {/* ✅ Name Field with Validation */}
              <div>
                <input
                  type="text"
                  placeholder="Full Name (e.g., John Doe)"
                  className={`w-full border-2 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-gray-800 ${
                    nameError
                      ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                      : "border-gray-200 focus:ring-indigo-400 focus:border-indigo-400"
                  }`}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => name && validateName(name)}
                  required
                  disabled={loading}
                />
                {nameError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">
                    ❌ {nameError}
                  </p>
                )}
              </div>

              {/* ✅ Email Field with Validation */}
              <div>
                <input
                  type="email"
                  placeholder="Email address (e.g., john@example.com)"
                  className={`w-full border-2 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-gray-800 ${
                    emailError
                      ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                      : "border-gray-200 focus:ring-indigo-400 focus:border-indigo-400"
                  }`}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => email && validateEmail(email)}
                  required
                  disabled={loading}
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">
                    ❌ {emailError}
                  </p>
                )}
              </div>

              {/* ✅ Phone Field with Validation */}
              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (10 digits)"
                  className={`w-full border-2 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-gray-800 ${
                    phoneError
                      ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                      : "border-gray-200 focus:ring-indigo-400 focus:border-indigo-400"
                  }`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => phone && validatePhone(phone)}
                  required
                  disabled={loading}
                  maxLength={15}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">
                    ❌ {phoneError}
                  </p>
                )}
                {!phoneError && phone && (
                  <p className="text-green-500 text-sm mt-2 ml-2">
                    ✓ Valid phone number
                  </p>
                )}
              </div>

              {/* ✅ Password Field with Strength Indicator */}
              <div>
                <input
                  type="password"
                  placeholder="Password (min. 8 characters)"
                  className={`w-full border-2 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 transition-all placeholder:text-gray-400 text-gray-800 ${
                    passwordError
                      ? "border-red-300 focus:ring-red-400 focus:border-red-400"
                      : "border-gray-200 focus:ring-indigo-400 focus:border-indigo-400"
                  }`}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => password && validatePassword(password)}
                  required
                  disabled={loading}
                />

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: getPasswordStrengthWidth() }}
                        />
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          passwordStrength === "weak"
                            ? "text-red-500"
                            : passwordStrength === "medium"
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {passwordStrength.toUpperCase()}
                      </span>
                    </div>
                    {passwordError && (
                      <p className="text-red-500 text-sm ml-2">
                        ❌ {passwordError}
                      </p>
                    )}
                    {!passwordError && passwordStrength === "strong" && (
                      <p className="text-green-500 text-sm ml-2">
                        ✓ Strong password!
                      </p>
                    )}
                  </div>
                )}

                {/* Password Requirements */}
                {password && passwordStrength !== "strong" && (
                  <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-blue-800 mb-2">
                      Password should have:
                    </p>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li
                        className={password.length >= 8 ? "text-green-600" : ""}
                      >
                        {password.length >= 8 ? "✓" : "○"} At least 8 characters
                      </li>
                      <li
                        className={
                          /[a-z]/.test(password) && /[A-Z]/.test(password)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        {/[a-z]/.test(password) && /[A-Z]/.test(password)
                          ? "✓"
                          : "○"}{" "}
                        Uppercase & lowercase letters
                      </li>
                      <li
                        className={/\d/.test(password) ? "text-green-600" : ""}
                      >
                        {/\d/.test(password) ? "✓" : "○"} At least one number
                      </li>
                      <li
                        className={
                          /[!@#$%^&*(),.?":{}|<>]/.test(password)
                            ? "text-green-600"
                            : ""
                        }
                      >
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"}{" "}
                        Special character (!@#$%...)
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* ✅ Profile Photo Upload Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📸</span>
                  Profile Photo
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <label className="flex items-center justify-between cursor-pointer border-2 border-dashed border-indigo-300 p-4 rounded-xl bg-white hover:border-indigo-500 transition-all">
                  <div className="flex items-center gap-3">
                    {profilePreview ? (
                      <img
                        src={profilePreview}
                        alt="Profile preview"
                        className="w-16 h-16 object-cover rounded-full border-4 border-indigo-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-3xl">👤</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-700">
                        {profilePhoto ? "✓ Photo Selected" : "Click to upload"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {profilePhoto
                          ? profilePhoto.name
                          : "JPG, PNG (max 5MB)"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePhotoChange}
                    className="hidden"
                    required
                    disabled={loading}
                  />
                </label>
              </div>

              {/* ✅ ID Proof Upload Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🆔</span>
                  ID Proof (Aadhar/License)
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <label className="flex items-center justify-between cursor-pointer border-2 border-dashed border-purple-300 p-4 rounded-xl bg-white hover:border-purple-500 transition-all">
                  <div className="flex items-center gap-3">
                    {idProofPreview ? (
                      <img
                        src={idProofPreview}
                        alt="ID preview"
                        className="w-16 h-16 object-cover rounded-lg border-4 border-purple-200 shadow-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="text-3xl">📄</span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-700">
                        {idProofPhoto ? "✓ ID Uploaded" : "Click to upload"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {idProofPhoto
                          ? idProofPhoto.name
                          : "JPG, PNG (max 5MB)"}
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdProofChange}
                    className="hidden"
                    required
                    disabled={loading}
                  />
                </label>
              </div>

              {/* ✅ Submit Button */}
              <button
                disabled={
                  loading ||
                  !!nameError ||
                  !!emailError ||
                  !!phoneError ||
                  !!passwordError
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-600">
              Already have an account?{" "}
              <span
                className="text-indigo-600 cursor-pointer font-semibold hover:text-purple-600 transition-colors"
                onClick={() => router.push("/seeker/login")}
              >
                Sign In
              </span>
            </p>
          </div>
        </div>
      </main>

      {/* ✅ Dialog Component */}
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
