"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if SuperAdmin
      if (email === "admin@eventhire.com" && password === "SuperAdmin@2026") {
        const superAdminUser = {
          id: 'superadmin',
          email: "admin@eventhire.com",
          user_type: "superadmin",
          company_name: "SuperAdmin",
        };
        
        localStorage.setItem("currentUser", JSON.stringify(superAdminUser));
        alert("Welcome SuperAdmin! 👑");
        
        setTimeout(() => {
          router.push("/superadmin/dashboard");
        }, 100);
        return;
      }

      // Regular company login
      const res = await fetch("/api/auth/company/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid credentials");
      }

      if (data.success && data.user) {
        localStorage.setItem("currentUser", JSON.stringify(data.user));
        
        console.log("User stored:", data.user);
        
        alert("Login Successful!");
        
        setTimeout(() => {
          router.push("/company/dashboard");
        }, 100);
      }
    } catch (error: any) {
      alert(error.message || "Login failed");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Welcome Back
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="email"
              placeholder="Email address"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* <p className="text-sm text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <span
            className="text-indigo-600 cursor-pointer font-semibold hover:text-purple-600 transition-colors"
            onClick={() => router.push("/auth/signup")}
          >
            Sign Up
          </span>
        </p> */}

        {/* <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
          <p className="text-xs text-indigo-700 text-center">
            💡 <strong>SuperAdmin Login:</strong>
            <br />
            Email: admin@eventhire.com
            <br />
            Password: SuperAdmin@2026
          </p>
        </div> */}
      </div>
    </main>
  );
}