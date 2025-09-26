// src/components/Verification.jsx
import React, { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";

export default function Verification({ onNavigate }) {
  const API_ROOT = import.meta.env.VITE_API_URL;
  const token    = localStorage.getItem("token");
  const user     = JSON.parse(localStorage.getItem("user") || "{}");
  const role     = user.role;

  const [verifiedMarketers, setVerifiedMarketers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // new search states
  const [searchId, setSearchId]         = useState("");
  const [searchLocation, setSearchLocation] = useState("");

  useEffect(() => {
    const fetchVerified = async () => {
      setLoading(true);
      let endpoint;

      if (role === "MasterAdmin") {
        endpoint = "/api/verification/verified-master";
      } else if (role === "SuperAdmin") {
        endpoint = "/api/verification/verified-superadmin";
      } else if (role === "Admin") {
        endpoint = "/api/verification/verified-admin";
      } else {
        setError("You are not authorized to view this page.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_ROOT}${endpoint}`, {
          headers: {
            "Content-Type":  "application/json",
            Authorization:   `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || `Failed to fetch (${res.status})`);
        }
        const { marketers } = await res.json();
        setVerifiedMarketers(marketers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerified();
  }, [API_ROOT, role, token]);

  // apply filters
  const filtered = verifiedMarketers.filter((m) => {
    const matchesId = m.unique_id.toLowerCase().includes(searchId.toLowerCase());
    const loc = m.location || "";
    const matchesLoc = loc.toLowerCase().includes(searchLocation.toLowerCase());
    return matchesId && matchesLoc;
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Back to Overview Navigation */}
      {onNavigate && (
        <div className="mb-6">
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </button>
        </div>
      )}
      
      <h1 className="text-4xl font-bold text-center mb-6">Verified Marketers</h1>

      {error && (
        <p className="text-red-600 text-center mb-4">{error}</p>
      )}

      {role === "MasterAdmin" && (
        <div className="flex gap-4 justify-center mb-6">
          <input
            type="text"
            placeholder="Search by ID"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            className="border rounded px-3 py-2 w-48"
          />
          <input
            type="text"
            placeholder="Search by Location"
            value={searchLocation}
            onChange={e => setSearchLocation(e.target.value)}
            className="border rounded px-3 py-2 w-48"
          />
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-500">No verified marketers found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Location</th>
                <th className="px-6 py-3 text-left text-sm font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((m) => (
                <tr key={m.unique_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.first_name} {m.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.unique_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.phone || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{m.location || "—"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
