"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostRedirect() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("posterUser");

    if (!user) {
      router.push("/auth/login");
      return;
    }

    const parsedUser = JSON.parse(user);

    if (parsedUser.role === "superadmin") {
      // SuperAdmin posts from approval modal
      router.push("/superadmin/dashboard");
    } else {
      // Companies submit requests
      router.push("/company/submit-request");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}