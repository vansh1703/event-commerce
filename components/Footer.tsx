"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              EventHire
            </h3>
            <p className="text-purple-200 text-sm leading-relaxed">
              Connecting event organizers with talented job seekers. Find your next opportunity or hire the perfect team.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/events" className="text-purple-200 hover:text-white transition-colors text-sm">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/seeker/login" className="text-purple-200 hover:text-white transition-colors text-sm">
                  Seeker Login
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="text-purple-200 hover:text-white transition-colors text-sm">
                  Company Login
                </Link>
              </li>
              <li>
                <Link href="/seeker/signup" className="text-purple-200 hover:text-white transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-purple-200">
                📧 Email: <a href="mailto:contact@eventhire.com" className="hover:text-white transition-colors">contact@eventhire.com</a>
              </li>
              <li className="text-purple-200">
                📞 Phone: <a href="tel:+1234567890" className="hover:text-white transition-colors">+1 (234) 567-890</a>
              </li>
              <li className="text-purple-200">
                📍 Location: Your City, Country
              </li>
            </ul>
          </div>

          {/* Social Media - Fixed the missing <a> tags here */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                <span className="text-xl">📷</span>
              </a>

              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                <span className="text-xl">📘</span>
              </a>

              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                <span className="text-xl">🐦</span>
              </a>

              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all hover:scale-110"
              >
                <span className="text-xl">💼</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-purple-200 text-sm">
            © {new Date().getFullYear()} EventHire. All rights reserved.
          </p>
          <p className="text-purple-200 text-sm">
            Created with 💜 by <span className="font-semibold text-white">Your Name</span>
          </p>
        </div>
      </div>
    </footer>
  );
}