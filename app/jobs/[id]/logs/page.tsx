"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../lib/authStore";

export default function JobLogs() {
  const { id } = useParams();
  const [logs, setLogs] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const { token, isLoading, checkToken } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    checkToken();
  }, [checkToken]);

  useEffect(() => {
    if (!isClient || isLoading) return;

    // Redirect to /login if not logged in
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch logs if authenticated and id is present
    if (id) fetchLogs(parseInt(id as string));
  }, [id, token, router, isClient, isLoading]); // Added isLoading to dependencies

  const fetchLogs = async (jobId: number) => {
    try {
      if (!token) throw new Error("No authentication token found");
      const res = await fetch(`/api/indexing-jobs/${jobId}/logs`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || `Failed to fetch logs: ${res.statusText}`
        );
      }
      const data = await res.json();
      setLogs(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch logs");
      console.error(err);
    }
  };

  // Show a loading state while checking the token
  if (isLoading || !isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Job Logs (Job ID: {id})
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-center">No logs available yet.</p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="relative bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full bg-indigo-600"></div>
              <div className="ml-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  {log.log_level.toUpperCase()}
                </h3>
                <p className="mt-1 text-gray-600">{log.message}</p>
                <p className="mt-2 text-sm text-gray-500">
                  {new Date(log.created_at).toLocaleString()}
                </p>
                {log.details && (
                  <pre className="mt-4 p-4 bg-gray-100 rounded-md text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
