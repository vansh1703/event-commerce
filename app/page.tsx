"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<
    "hero" | "about" | "what-we-do"
  >("hero");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigateTo = (section: "hero" | "about" | "what-we-do") => {
    setActiveSection(section);
    setMobileMenuOpen(false); // Close menu after navigation
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EventHire
            </h1>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-6">
              <button
                onClick={() => navigateTo("hero")}
                className={`font-semibold transition-all ${
                  activeSection === "hero"
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("about")}
                className={`font-semibold transition-all ${
                  activeSection === "about"
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => navigateTo("what-we-do")}
                className={`font-semibold transition-all ${
                  activeSection === "what-we-do"
                    ? "text-indigo-600"
                    : "text-gray-600 hover:text-indigo-600"
                }`}
              >
                What We Do
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex flex-col gap-1.5 p-2"
              aria-label="Toggle menu"
            >
              <span
                className={`w-6 h-0.5 bg-indigo-600 transition-all ${
                  mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`w-6 h-0.5 bg-indigo-600 transition-all ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`w-6 h-0.5 bg-indigo-600 transition-all ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3 border-t border-gray-200 pt-4">
              <button
                onClick={() => navigateTo("hero")}
                className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeSection === "hero"
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("about")}
                className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeSection === "about"
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => navigateTo("what-we-do")}
                className={`block w-full text-left px-4 py-2 rounded-lg font-semibold transition-all ${
                  activeSection === "what-we-do"
                    ? "bg-indigo-100 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                What We Do
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      {activeSection === "hero" && (
        <section className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EventHire
            </h1>
            <p className="text-lg md:text-2xl text-gray-600 mb-12">
              Solving the event staffing crisis, one connection at a time
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Job Seekers */}
              <div
                onClick={() => router.push("/events")}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="text-5xl md:text-6xl mb-4">🔍</div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                  Find Event Jobs
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Browse available event opportunities and apply instantly
                </p>
              </div>

              {/* Companies */}
              <div
                onClick={() => router.push("/auth/login")}
                className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 hover:shadow-3xl hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="text-5xl md:text-6xl mb-4">📝</div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                  Post Event Jobs
                </h2>
                <p className="text-sm md:text-base text-gray-600">
                  Find qualified helpers for your events quickly
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* About Us Section */}
      {activeSection === "about" && (
        <section className="min-h-[calc(100vh-80px)] px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-2xl border border-white/20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                About EventHire
              </h2>

              <div className="space-y-4 md:space-y-6 text-gray-700 text-base md:text-lg leading-relaxed">
                <p>
                  <span className="font-bold text-indigo-600">EventHire</span>{" "}
                  was born from a real problem we witnessed firsthand: event
                  organizers struggling to find reliable staff at the last
                  minute, and talented individuals missing out on flexible
                  earning opportunities.
                </p>

                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-4 md:p-6 rounded-lg my-4 md:my-6">
                  <h3 className="text-lg md:text-xl font-bold text-red-700 mb-3">
                    The Problem We Saw
                  </h3>
                  <ul className="space-y-2 text-sm md:text-base text-gray-700">
                    <li>
                      🚨 <strong>Event organizers</strong> were scrambling hours
                      before events, calling dozens of people to fill positions
                    </li>
                    <li>
                      💼 <strong>Companies</strong> were paying premium rates to
                      unreliable staffing agencies
                    </li>
                    <li>
                      😔 <strong>Job seekers</strong> had no centralized
                      platform to find short-term, well-paying event gigs
                    </li>
                    <li>
                      ⏰ <strong>Last-minute cancellations</strong> left events
                      understaffed and disorganized
                    </li>
                  </ul>
                </div>

                <p>
                  We realized there was a massive disconnect in the market.
                  Event companies needed a reliable, verified pool of helpers.
                  Job seekers needed a trustworthy platform that respected their
                  time and paid fairly.
                </p>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 md:p-6 rounded-lg my-4 md:my-6">
                  <h3 className="text-lg md:text-xl font-bold text-green-700 mb-3">
                    Our Solution
                  </h3>
                  <p className="text-sm md:text-base text-gray-700">
                    EventHire connects event organizers directly with
                    pre-verified, skilled helpers through a transparent,
                    admin-curated platform. We ensure quality on both sides:
                    companies get reliable staff, and workers get legitimate
                    opportunities.
                  </p>
                </div>

                <p>
                  Our mission is simple:{" "}
                  <span className="font-bold text-purple-600">
                    Make event staffing stress-free, transparent, and fair for
                    everyone
                  </span>
                  .
                </p>
              </div>

              <div className="mt-8 md:mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="text-center p-4 md:p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">🎯</div>
                  <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">
                    Our Mission
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Bridge the gap between event organizers and talented helpers
                  </p>
                </div>

                <div className="text-center p-4 md:p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">🔍</div>
                  <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">
                    Our Vision
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Become India's most trusted event staffing platform
                  </p>
                </div>

                <div className="text-center p-4 md:p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl">
                  <div className="text-3xl md:text-4xl mb-2 md:mb-3">💡</div>
                  <h3 className="font-bold text-gray-800 mb-2 text-sm md:text-base">
                    Our Values
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    Trust, transparency, and quality in every connection
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* What We Do Section */}
      {activeSection === "what-we-do" && (
        <section className="min-h-[calc(100vh-80px)] px-4 md:px-6 py-8 md:py-12 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-12 shadow-2xl border border-white/20">
              <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                What We Do
              </h2>

              <p className="text-lg md:text-xl text-gray-700 mb-6 md:mb-10">
                EventHire is a{" "}
                <strong className="text-indigo-600">curated marketplace</strong>{" "}
                that connects event companies with verified helpers through an
                admin-approved process.
              </p>

              <div className="space-y-6 md:space-y-8">
                {/* How It Works */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base">
                      ⚙️
                    </span>
                    How EventHire Works
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
                    {/* For Companies */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 md:p-6 border-2 border-blue-200">
                      <h4 className="text-lg md:text-xl font-bold text-blue-800 mb-3 md:mb-4 flex items-center gap-2">
                        🏢 For Event Companies
                      </h4>
                      <ol className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">1.</span>
                          <span>
                            <strong>Contact SuperAdmin</strong> to get company
                            credentials created
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">2.</span>
                          <span>
                            <strong>Submit job requests</strong> with event
                            details, payment, and requirements
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">3.</span>
                          <span>
                            <strong>Get email notifications</strong> when jobs
                            are approved or rejected with reasons
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">4.</span>
                          <span>
                            <strong>Review verified applicants</strong> with
                            ratings, photos, and ID proofs
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">5.</span>
                          <span>
                            <strong>Search & filter</strong> through active jobs
                            and accepted candidates
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">6.</span>
                          <span>
                            <strong>Access event history</strong> with complete
                            candidate records and performance data
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-blue-600">7.</span>
                          <span>
                            <strong>Export candidate data</strong> to Excel for
                            your records
                          </span>
                        </li>
                      </ol>
                    </div>

                    {/* For Job Seekers */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 md:p-6 border-2 border-green-200">
                      <h4 className="text-lg md:text-xl font-bold text-green-800 mb-3 md:mb-4 flex items-center gap-2">
                        👤 For Job Seekers
                      </h4>
                      <ol className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">1.</span>
                          <span>
                            <strong>Create free account</strong> with verified
                            profile and ID proof
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">2.</span>
                          <span>
                            <strong>Browse verified jobs</strong> posted by
                            legitimate companies
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">3.</span>
                          <span>
                            <strong>Apply with one click</strong> - your profile
                            is automatically sent
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">4.</span>
                          <span>
                            <strong>Get email notifications</strong> instantly
                            when your application is accepted or rejected
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">5.</span>
                          <span>
                            <strong>Track your applications</strong> with
                            real-time status updates
                          </span>
                        </li>
                        <li className="flex gap-2 md:gap-3">
                          <span className="font-bold text-green-600">6.</span>
                          <span>
                            <strong>Build your reputation</strong> with ratings
                            and track your event history
                          </span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base">
                      ✨
                    </span>
                    Key Features
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">✅</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Admin Verification
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Every job and candidate is manually reviewed for
                          quality
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">🆔</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          ID Proof & Photos
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          All seekers provide verified ID and profile photos
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">⭐</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Rating System
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Track performance history and build reputation
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">🚩</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Red Flag System
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Report and track problematic behavior to maintain
                          quality
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📊</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Excel Export
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Companies can export candidate lists with photos and
                          details
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">🔒</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Date Conflict Prevention
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Auto-prevent double bookings with smart scheduling
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📝</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Custom Fields
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Companies can request specific qualifications per job
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📱</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Mobile Optimized
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Works perfectly on phones, tablets, and desktops
                        </p>
                      </div>
                    </div>

                    <div className="bg-white border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📧</span>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm md:text-base">
                          Email Notifications
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600">
                          Real-time email alerts for job status, applications,
                          and approvals
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Company Advanced Features */}
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6 flex items-center gap-3">
                    <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm md:text-base">
                      🏢
                    </span>
                    Advanced Company Tools
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📜</span>
                      <div>
                        <h4 className="font-bold text-blue-800 text-sm md:text-base">
                          Event History Dashboard
                        </h4>
                        <p className="text-xs md:text-sm text-blue-600">
                          Access complete event history with accepted
                          candidates, ratings, and performance data
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">🔍</span>
                      <div>
                        <h4 className="font-bold text-purple-800 text-sm md:text-base">
                          Advanced Search & Filters
                        </h4>
                        <p className="text-xs md:text-sm text-purple-600">
                          Search jobs by title, location, event type, and filter
                          candidates by skills
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📧</span>
                      <div>
                        <h4 className="font-bold text-green-800 text-sm md:text-base">
                          Automated Email Updates
                        </h4>
                        <p className="text-xs md:text-sm text-green-600">
                          Get instant email notifications for job approvals,
                          rejections, and new applications
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl p-3 md:p-4 flex items-start gap-2 md:gap-3">
                      <span className="text-xl md:text-2xl">📋</span>
                      <div>
                        <h4 className="font-bold text-orange-800 text-sm md:text-base">
                          Rejected Requests Management
                        </h4>
                        <p className="text-xs md:text-sm text-orange-600">
                          Dedicated page to review rejected job requests with
                          reasons and resubmission options
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* The Problem We Solve */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-l-4 border-orange-500 rounded-2xl p-4 md:p-6 mt-6 md:mt-8">
                  <h3 className="text-lg md:text-2xl font-bold text-orange-800 mb-3 md:mb-4">
                    💡 The Real Problem We Solve
                  </h3>
                  <div className="space-y-2 md:space-y-3 text-sm md:text-base text-gray-700">
                    <p>
                      <strong className="text-orange-700">
                        Before EventHire:
                      </strong>{" "}
                      Companies spent hours making calls, dealing with no-shows,
                      and paying agencies 30-40% markup. Job seekers had no way
                      to find legitimate event work.
                    </p>
                    <p>
                      <strong className="text-green-700">
                        With EventHire:
                      </strong>{" "}
                      Companies post once and get verified candidates instantly.
                      Seekers browse verified jobs and build their reputation.
                      Everyone wins.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8 mb-6 md:mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                EventHire
              </h3>
              <p className="text-purple-200 text-xs md:text-sm">
                Solving the event staffing crisis, one connection at a time
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
                Quick Links
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => navigateTo("hero")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Home
                </button>
                <button
                  onClick={() => navigateTo("about")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  About Us
                </button>
                <button
                  onClick={() => navigateTo("what-we-do")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  What We Do
                </button>
                <button
                  onClick={() => router.push("/events")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Browse Jobs
                </button>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Company Login
                </button>
              </div>
            </div>

            {/* For Job Seekers */}
            <div>
              <h4 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
                For Job Seekers
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => router.push("/seeker/signup")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => router.push("/seeker/login")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Seeker Login
                </button>
                <button
                  onClick={() => router.push("/events")}
                  className="block text-purple-200 hover:text-white transition-colors text-xs md:text-sm"
                >
                  Find Jobs
                </button>
              </div>
            </div>
          </div>
          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Need Support?</h4>
            <div className="space-y-2 text-sm">
              <p className="text-purple-200">
                📧 Email:{" "}
                <a
                  href="mailto:support@eventhire.com"
                  className="hover:text-white transition-colors"
                >
                  support@eventhire.com
                </a>
              </p>
              <p className="text-purple-200">
                📞 Phone:{" "}
                <a
                  href="tel:+1234567890"
                  className="hover:text-white transition-colors"
                >
                  +1 (234) 567-890
                </a>
              </p>
            </div>
          </div>

          <div className="border-t border-purple-700 pt-4 md:pt-6 text-center text-xs md:text-sm text-purple-200">
            <p>© {new Date().getFullYear()} EventHire. All rights reserved.</p>
            <p className="mt-2">
              Made with 💜 by{" "}
              <span className="font-semibold text-white">Vansh</span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
