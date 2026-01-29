"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to auth page if not authenticated, otherwise to dashboard
    if (isAuthenticated()) {
      router.push("/dashboard");
    } else {
      router.push("/auth");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0E1015] flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  );
}
