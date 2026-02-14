"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    alert("Logged out successfully!");
    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gradient-to-r from-red-500 to-rose-600 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl hover:from-red-600 hover:to-rose-700 transition-all duration-300 font-semibold shadow-lg text-sm md:text-base"
    >
      Logout
    </button>
  );
}