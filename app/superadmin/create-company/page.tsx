"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/navbar/LogoutButton";

export default function CreateCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("currentUser");

    if (!user) {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.user_type !== "superadmin") {
      alert("Unauthorized! SuperAdmin access only.");
      router.push("/auth/login");
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(`✅ Company created successfully!\n\nCredentials:\nEmail: ${email}\nPassword: ${password}\n\nShare these credentials with the company.`);
        
        // Reset form
        setCompanyName("");
        setEmail("");
        setPassword("");
        setCompanyAddress("");
        setContactPerson("");
        setPhone("");
      }
    } catch (error: any) {
      alert(error.message || "Failed to create company");
      console.error("Create company error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            👑 Create New Company Account
          </h1>
          <p className="text-gray-600 mb-8">
            Create credentials for a new company. Share the login details with them after creation.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Events Pvt Ltd"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person Name *
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email (Login Credential) *
              </label>
              <input
                type="email"
                placeholder="e.g., company@example.com"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password (Login Credential) *
              </label>
              <input
                type="text"
                placeholder="Create a strong password"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Minimum 6 characters. Share this with the company.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="text"
                placeholder="e.g., +91 9876543210"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address *
              </label>
              <textarea
                placeholder="Full company address"
                className="w-full border-2 border-gray-200 p-4 rounded-2xl min-h-[100px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none text-gray-800"
                value={companyAddress}
                onChange={(e) => setCompanyAddress(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ Important: After creating the account, share the email and password with the company so they can log in.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50"
            >
              {loading ? "Creating Company..." : "Create Company Account"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}