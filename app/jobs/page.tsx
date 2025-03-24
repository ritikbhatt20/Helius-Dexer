"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../components/Button";
import { useAuthStore } from "../lib/authStore";

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [form, setForm] = useState({
    db_connection_id: "",
    job_type: "nft_bids" as const,
    configuration: "{}",
    target_table: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to /login if not logged in
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch jobs and connections if authenticated
    fetchJobs();
    fetchConnections();
  }, [token, router]);

  const fetchJobs = async () => {
    try {
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("/api/indexing-jobs", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch jobs: ${res.statusText}`);
      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error(err);
    }
  };

  const fetchConnections = async () => {
    try {
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("/api/db-connections", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(`Failed to fetch connections: ${res.statusText}`);
      const data = await res.json();
      setConnections(data);
    } catch (err) {
      setError("Failed to fetch connections");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("/api/indexing-jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          db_connection_id: parseInt(form.db_connection_id),
          job_type: form.job_type,
          configuration: JSON.parse(form.configuration),
          target_table: form.target_table,
        }),
      });
      if (res.ok) {
        setSuccess("Job created successfully");
        fetchJobs();
        setForm({
          db_connection_id: "",
          job_type: "nft_bids",
          configuration: "{}",
          target_table: "",
        });
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to create job");
      }
    } catch (err) {
      setError("Failed to create job");
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Indexing Jobs</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border-l-4 border-green-500 text-green-700 rounded">
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {job.job_type} - {job.target_table}
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="flex items-center">
                <span className="font-medium mr-2">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${job.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                >
                  {job.status}
                </span>
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">DB Connection ID:</span>
                {job.db_connection_id}
              </p>
              <Link
                href={`/jobs/${job.id}/logs`}
                className="inline-block mt-2 text-indigo-600 hover:text-indigo-500 font-medium"
              >
                View Logs
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Create New Indexing Job
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Connection
              </label>
              <select
                value={form.db_connection_id}
                onChange={(e) =>
                  setForm({ ...form, db_connection_id: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Connection</option>
                {connections.map((conn) => (
                  <option key={conn.id} value={conn.id}>
                    {conn.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type
              </label>
              <select
                value={form.job_type}
                onChange={(e) =>
                  setForm({ ...form, job_type: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="nft_bids">NFT Bids</option>
                <option value="nft_prices">NFT Prices</option>
                <option value="token_borrowing">Token Borrowing</option>
                <option value="token_prices">Token Prices</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Configuration (JSON)
              </label>
              <input
                type="text"
                placeholder='{"key": "value"}'
                value={form.configuration}
                onChange={(e) =>
                  setForm({ ...form, configuration: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Table
              </label>
              <input
                type="text"
                placeholder="e.g., nft_bids_data"
                value={form.target_table}
                onChange={(e) =>
                  setForm({ ...form, target_table: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-300"
            >
              Create Job
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
