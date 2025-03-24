"use client";

import { useState, useEffect } from "react";
import { Button } from "../components/Button";

export default function Connections() {
  const [connections, setConnections] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    host: "",
    port: 5432,
    username: "",
    password: "",
    database_name: "",
    ssl: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      const token = localStorage.getItem("token"); // Get the JWT token
      if (!token) throw new Error("No authentication token found");
      const res = await fetch("/api/db-connections", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Add auth header
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch connections: ${res.statusText}`);
      }
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
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const testRes = await fetch("/api/db-connections/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const testData = await testRes.json();
      if (!testData.success) throw new Error("Connection test failed");
      const createRes = await fetch("/api/db-connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (createRes.ok) {
        setSuccess("Connection added successfully");
        fetchConnections();
        setForm({
          name: "",
          host: "",
          port: 5432,
          username: "",
          password: "",
          database_name: "",
          ssl: false,
        });
      } else {
        setError("Failed to add connection");
      }
    } catch (err) {
      setError("Failed to add connection");
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        Database Connections
      </h2>

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
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {conn.name}
            </h3>
            <div className="space-y-2 text-gray-600">
              <p className="flex items-center">
                <span className="font-medium mr-2">Host:</span>
                {conn.host}:{conn.port}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">Database:</span>
                {conn.database_name}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">SSL:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${conn.ssl ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                >
                  {conn.ssl ? "Enabled" : "Disabled"}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Add New Connection
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connection Name
              </label>
              <input
                type="text"
                placeholder="My Database"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Host
              </label>
              <input
                type="text"
                placeholder="localhost or IP address"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port
              </label>
              <input
                type="number"
                placeholder="5432"
                value={form.port}
                onChange={(e) =>
                  setForm({ ...form, port: parseInt(e.target.value) })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                placeholder="postgres"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Database Name
              </label>
              <input
                type="text"
                placeholder="mydb"
                value={form.database_name}
                onChange={(e) =>
                  setForm({ ...form, database_name: e.target.value })
                }
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SSL Connection
              </label>
              <select
                value={form.ssl ? "true" : "false"}
                onChange={(e) =>
                  setForm({ ...form, ssl: e.target.value === "true" })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="false">No SSL</option>
                <option value="true">Use SSL</option>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-300"
            >
              Test & Add Connection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
