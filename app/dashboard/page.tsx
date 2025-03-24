"use client";

import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-6 text-center">
          Welcome to Helius Indexer
        </h2>
        <p className="text-lg text-gray-600 text-center mb-8">
          Power your blockchain data with seamless indexing on Solana.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Manage Connections
            </h3>
            <p className="text-gray-600 mb-4">
              Connect your Postgres database to start indexing Solana data.
            </p>
            <Link
              href="/connections"
              className="inline-block px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-300"
            >
              Go to Connections
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Manage Jobs
            </h3>
            <p className="text-gray-600 mb-4">
              Create and monitor indexing jobs for your blockchain data.
            </p>
            <Link
              href="/jobs"
              className="inline-block px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-300"
            >
              Go to Jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
