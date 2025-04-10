/* eslint-disable */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "../lib/authStore";
import { HoverEffect } from "@/components/ui/card-hover-effect";

export default function Dashboard() {
  const { token } = useAuthStore();
  const router = useRouter();

  // Redirect to /login if not logged in
  useEffect(() => {
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  const projects = [
    {
      title: "Manage Connections",
      description:
        "Connect your Postgres database to start indexing Solana data.",
      link: "/connections",
      text: "Go to Connections",
    },
    {
      title: "Manage Jobs",
      description: "Create and monitor indexing jobs for your blockchain data.",
      link: "/jobs",
      text: "Go to Jobs",
    },
  ];

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold text-helius-orange mb-6 text-center">
          Welcome to Helius Indexer
        </h2>
        <p className="text-lg text-white text-center mb-8">
          Power your blockchain data with seamless indexing on Solana.
        </p>

        <HoverEffect items={projects} />
      </div>
    </div>
  );
}
