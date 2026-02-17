"use client";

export default function CompanyFooter() {
  return (
    <footer className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          {/* Company Name */}
          <div>
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              EventHire
            </h3>
            <p className="text-purple-200 text-sm">
              Connecting companies with talented event staff
            </p>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Need Support?</h4>
            <p className="text-purple-200 text-sm mb-2">
              📧 Email: <a href="mailto:newa1703@gmail.com" className="hover:text-white transition-colors">newa1703@gmail.com</a>
            </p>
            <p className="text-purple-200 text-sm">
              📞 Phone: <a href="tel:9717921434" className="hover:text-white transition-colors">9717921434</a>
            </p>
          </div>

          {/* Created By */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Created By</h4>
            <p className="text-purple-200 text-sm">
              Made with 💜 by <span className="font-semibold text-white">Vansh</span>
            </p>
            <p className="text-purple-200 text-sm mt-2">
              © {new Date().getFullYear()} EventHire. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}