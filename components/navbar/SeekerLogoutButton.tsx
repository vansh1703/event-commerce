"use client";

import { useRouter } from "next/navigation";

export default function SeekerLogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("seekerUser");
    alert("Logged out successfully!");
    router.push("/");
  };

  return (
    <>
      {/* Desktop */}
      <button
        onClick={handleLogout}
        className="hidden md:block bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
      >
        Logout
      </button>

      {/* Mobile - Icon only */}
      <button
        onClick={handleLogout}
        className="md:hidden bg-gradient-to-r from-rose-500 to-pink-600 text-white p-3 rounded-xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 shadow-lg"
        title="Logout"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </>
  );
}