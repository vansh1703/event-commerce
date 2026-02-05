"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("posterUser");

    alert("Logged out successfully!");

    router.push("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-gradient-to-r from-rose-500 to-pink-600 text-white px-6 py-3 rounded-2xl hover:from-rose-600 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
    >
      Logout
    </button>
  );
}