"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if SuperAdmin
    if (email === SUPERADMIN_EMAIL && password === SUPERADMIN_PASSWORD) {
      localStorage.setItem(
        "posterUser",
        JSON.stringify({ 
          email: SUPERADMIN_EMAIL, 
          companyName: "SuperAdmin",
          role: "superadmin" 
        })
      );
      alert("Welcome SuperAdmin! 👑");
      router.push("/superadmin/dashboard");
      return;
    }

    // Check regular poster accounts
    const storedAccounts = localStorage.getItem("posterAccount");

    if (!storedAccounts) {
      alert("No account found. Please signup first.");
      router.push("/auth/signup");
      return;
    }

    let accounts;
    try {
      accounts = JSON.parse(storedAccounts);
    } catch (e) {
      alert("Account data corrupted. Please signup again.");
      localStorage.removeItem("posterAccount");
      router.push("/auth/signup");
      return;
    }

    // Handle both array and single object formats
    const accountsArray = Array.isArray(accounts) ? accounts : [accounts];
    
    const account = accountsArray.find(
      (acc: any) => acc.email === email && acc.password === password
    );

    if (account) {
      // Save session with role
      localStorage.setItem(
        "posterUser",
        JSON.stringify({ 
          email: account.email, 
          companyName: account.companyName || "Company",
          role: "company" 
        })
      );

      alert("Login Successful!");
      router.push("/company/dashboard");
    } else {
      alert("Invalid email or password!");
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
            />
          </div>

          <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
            Sign In
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          Don't have an account?{" "}
          <span
            className="text-indigo-600 cursor-pointer font-semibold hover:text-purple-600 transition-colors"
            onClick={() => router.push("/auth/signup")}
          >
            Sign Up
          </span>
        </p>

        {/* <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-200">
          <p className="text-xs text-indigo-700 text-center">
            💡 <strong>SuperAdmin Login:</strong><br/>
            Email: admin@eventhire.com<br/>
            Password: SuperAdmin@2026
          </p>
        </div> */}
      </div>
    </main>
  );
}