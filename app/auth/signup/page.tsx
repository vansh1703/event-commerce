"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();

    // Load existing accounts
    const storedAccounts = localStorage.getItem("posterAccount");
    let accountsArray = [];

    if (storedAccounts) {
      try {
        const parsed = JSON.parse(storedAccounts);
        accountsArray = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.error("Error parsing accounts:", e);
        accountsArray = [];
      }
    }

    // Check if email already exists
    const accountExists = accountsArray.find((acc: any) => acc.email === email);

    if (accountExists) {
      alert("Account already exists! Please login.");
      router.push("/auth/login");
      return;
    }

    // Add new account
    const newAccount = { companyName, email, password };
    accountsArray.push(newAccount);

    // Save back to localStorage
    localStorage.setItem("posterAccount", JSON.stringify(accountsArray));

    alert("Signup Successful! Please login.");
    router.push("/auth/login");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6">
      <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100">
        <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Company Registration
        </h1>

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <input
              type="text"
              placeholder="Company Name"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Password (min 6 characters)"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl">
            Sign Up
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          Already have an account?{" "}
          <span
            className="text-indigo-600 cursor-pointer font-semibold hover:text-purple-600 transition-colors"
            onClick={() => router.push("/auth/login")}
          >
            Sign In
          </span>
        </p>
      </div>
    </main>
  );
}