"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";
import Dialog from "@/components/ui/Dialog";
import { useDialog } from "@/hooks/useDialog";

export default function CreateCompanyPage() {
  const router = useRouter();
  const dialog = useDialog();
  
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");

  // ✅ Validation States
  const [companyNameError, setCompanyNameError] = useState("");
  const [contactPersonError, setContactPersonError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | "">("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      dialog.showWarning(
        "Unauthorized Access",
        "SuperAdmin access required. Please login."
      );
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "superadmin") {
      dialog.showWarning(
        "Unauthorized Access",
        "Only SuperAdmin can create company accounts."
      );
      setTimeout(() => router.push("/auth/login"), 2000);
      return;
    }
  }, [router]);

  // ✅ VALIDATION FUNCTIONS

  // Validate Company Name (min 3 chars, only letters, numbers, spaces, &, .)
  const validateCompanyName = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setCompanyNameError("Company name is required");
      return false;
    }

    if (trimmed.length < 3) {
      setCompanyNameError("Company name must be at least 3 characters");
      return false;
    }

    // Only letters, numbers, spaces, &, ., and common punctuation
    const companyRegex = /^[a-zA-Z0-9\s&.,'-]+$/;
    if (!companyRegex.test(trimmed)) {
      setCompanyNameError("Company name contains invalid characters");
      return false;
    }

    setCompanyNameError("");
    return true;
  };

  // Validate Contact Person (at least 2 words, only letters and spaces)
  const validateContactPerson = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setContactPersonError("Contact person name is required");
      return false;
    }

    // Check if contains at least 2 words
    const words = trimmed.split(/\s+/);
    if (words.length < 2) {
      setContactPersonError("Please enter full name (first and last name)");
      return false;
    }

    // Only letters and spaces
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(trimmed)) {
      setContactPersonError("Name should only contain letters and spaces");
      return false;
    }

    setContactPersonError("");
    return true;
  };

  // Validate Email
  const validateEmail = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setEmailError("Email is required");
      return false;
    }

    // Email regex
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(trimmed)) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    // Check for typos in common domains
    const domain = trimmed.split("@")[1]?.toLowerCase();
    
    if (domain) {
      const typos: Record<string, string> = {
        "gmial.com": "gmail.com",
        "gmai.com": "gmail.com",
        "gmil.com": "gmail.com",
        "yahooo.com": "yahoo.com",
        "yaho.com": "yahoo.com",
        "outlok.com": "outlook.com",
        "hotmial.com": "hotmail.com",
      };

      if (typos[domain]) {
        setEmailError(`Did you mean ${typos[domain]}?`);
        return false;
      }
    }

    setEmailError("");
    return true;
  };

  // Check Password Strength
  const checkPasswordStrength = (value: string): "weak" | "medium" | "strong" => {
    let strength = 0;

    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/\d/.test(value)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++;

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
      setPasswordError("Password must be at least 8 characters");
      setPasswordStrength("weak");
      return false;
    }

    const strength = checkPasswordStrength(value);
    setPasswordStrength(strength);

    if (strength === "weak") {
      setPasswordError("Password is too weak. Add uppercase, numbers, and special characters");
      return false;
    }

    setPasswordError("");
    return true;
  };

  // Validate Phone
  const validatePhone = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setPhoneError("Phone number is required");
      return false;
    }

    const cleaned = trimmed.replace(/[\s\-+]/g, "").replace(/^91/, "");
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

  // Validate Address
  const validateAddress = (value: string): boolean => {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      setAddressError("Company address is required");
      return false;
    }

    if (trimmed.length < 10) {
      setAddressError("Please provide a complete address (min 10 characters)");
      return false;
    }

    setAddressError("");
    return true;
  };

  // ✅ Handle input changes with validation
  const handleCompanyNameChange = (value: string) => {
    setCompanyName(value);
    if (value.trim()) validateCompanyName(value);
  };

  const handleContactPersonChange = (value: string) => {
    setContactPerson(value);
    if (value.trim()) validateContactPerson(value);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value.trim()) validateEmail(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) validatePassword(value);
  };

  const handlePhoneChange = (value: string) => {
    const filtered = value.replace(/[^\d\s\-+]/g, "");
    setPhone(filtered);
    if (filtered.trim()) validatePhone(filtered);
  };

  const handleAddressChange = (value: string) => {
    setCompanyAddress(value);
    if (value.trim()) validateAddress(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate all fields
    const isCompanyNameValid = validateCompanyName(companyName);
    const isContactPersonValid = validateContactPerson(contactPerson);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isPhoneValid = validatePhone(phone);
    const isAddressValid = validateAddress(companyAddress);

    if (!isCompanyNameValid || !isContactPersonValid || !isEmailValid || 
        !isPasswordValid || !isPhoneValid || !isAddressValid) {
      dialog.showWarning(
        "Validation Error",
        "Please fix all errors before creating the company account"
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/create-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          email,
          password,
          companyAddress,
          contactPerson,
          phone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create company");
      }

      if (data.success) {
        dialog.showSuccess(
          "Company Created Successfully!",
          `Company account has been created.\n\nCredentials:\n📧 Email: ${email}\n🔑 Password: ${password}\n\nPlease share these credentials with the company.`
        );
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setCompanyName("");
          setEmail("");
          setPassword("");
          setCompanyAddress("");
          setContactPerson("");
          setPhone("");
          setPasswordStrength("");
        }, 2000);
      }
    } catch (error: any) {
      dialog.showError(
        "Creation Failed",
        error.message || "Failed to create company account. Please try again."
      );
      console.error("Create company error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get password strength color
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak": return "bg-red-500";
      case "medium": return "bg-yellow-500";
      case "strong": return "bg-green-500";
      default: return "bg-gray-200";
    }
  };

  // Get password strength width
  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak": return "33%";
      case "medium": return "66%";
      case "strong": return "100%";
      default: return "0%";
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-4 md:px-6 py-6 md:py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => router.push("/superadmin/dashboard")}
              className="text-indigo-600 hover:text-purple-600 font-semibold flex items-center gap-2"
            >
              ← Back to Dashboard
            </button>
            <LogoutButton />
          </div>

          <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
            <div className="text-center mb-2">
              <span className="text-5xl">👑</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Create New Company Account
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              Create credentials for a new company. Share the login details with them after creation.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Company Name */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  Company Name
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="e.g., ABC Events Pvt Ltd"
                  className={`w-full border-2 p-4 rounded-xl bg-white focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                    companyNameError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-blue-400"
                  }`}
                  value={companyName}
                  onChange={(e) => handleCompanyNameChange(e.target.value)}
                  onBlur={() => companyName && validateCompanyName(companyName)}
                  required
                  disabled={loading}
                />
                {companyNameError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {companyNameError}</p>
                )}
                {!companyNameError && companyName && companyName.length >= 3 && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid company name!</p>
                )}
              </div>

              {/* Contact Person */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">👤</span>
                  Contact Person Name
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  className={`w-full border-2 p-4 rounded-xl bg-white focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                    contactPersonError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-purple-400"
                  }`}
                  value={contactPerson}
                  onChange={(e) => handleContactPersonChange(e.target.value)}
                  onBlur={() => contactPerson && validateContactPerson(contactPerson)}
                  required
                  disabled={loading}
                />
                {contactPersonError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {contactPersonError}</p>
                )}
              </div>

              {/* Email */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📧</span>
                  Email (Login Credential)
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="email"
                  placeholder="e.g., company@example.com"
                  className={`w-full border-2 p-4 rounded-xl bg-white focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                    emailError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-green-400"
                  }`}
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => email && validateEmail(email)}
                  required
                  disabled={loading}
                />
                {emailError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {emailError}</p>
                )}
                {!emailError && email && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid email!</p>
                )}
              </div>

              {/* Password with Strength Indicator */}
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔑</span>
                  Password (Login Credential)
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="text"
                  placeholder="Create a strong password"
                  className={`w-full border-2 p-4 rounded-xl bg-white focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                    passwordError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-orange-400"
                  }`}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => password && validatePassword(password)}
                  required
                  disabled={loading}
                />
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3">
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
                      <p className="text-red-500 text-sm ml-2">❌ {passwordError}</p>
                    )}
                    {!passwordError && passwordStrength === "strong" && (
                      <p className="text-green-500 text-sm ml-2">✓ Strong password!</p>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-2">
                  💡 Minimum 8 characters. Share this with the company.
                </p>
              </div>

              {/* Phone */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📞</span>
                  Phone Number
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  className={`w-full border-2 p-4 rounded-xl bg-white focus:outline-none focus:ring-2 transition-all text-gray-800 ${
                    phoneError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-pink-400"
                  }`}
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  onBlur={() => phone && validatePhone(phone)}
                  required
                  disabled={loading}
                  maxLength={15}
                />
                {phoneError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {phoneError}</p>
                )}
                {!phoneError && phone && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Valid phone number!</p>
                )}
              </div>

              {/* Company Address */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📍</span>
                  Company Address
                  <span className="text-red-500 text-sm">*</span>
                </h3>
                <textarea
                  placeholder="Full company address with city and pincode"
                  className={`w-full border-2 p-4 rounded-xl min-h-[100px] bg-white focus:outline-none focus:ring-2 resize-none transition-all text-gray-800 ${
                    addressError
                      ? "border-red-300 focus:ring-red-400"
                      : "border-gray-200 focus:ring-indigo-400"
                  }`}
                  value={companyAddress}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  onBlur={() => companyAddress && validateAddress(companyAddress)}
                  required
                  disabled={loading}
                />
                {addressError && (
                  <p className="text-red-500 text-sm mt-2 ml-2">❌ {addressError}</p>
                )}
                {!addressError && companyAddress && companyAddress.length >= 10 && (
                  <p className="text-green-500 text-sm mt-2 ml-2">✓ Complete address!</p>
                )}
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
                <p className="text-sm text-yellow-800 font-semibold">
                  ⚠️ Important: After creating the account, share the email and password with the company so they can log in.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !!companyNameError || !!contactPersonError || !!emailError || 
                          !!passwordError || !!phoneError || !!addressError}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Company...
                  </span>
                ) : (
                  'Create Company Account'
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