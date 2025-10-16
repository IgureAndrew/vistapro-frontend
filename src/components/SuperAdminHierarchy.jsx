// src/components/SuperAdminHierarchy.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import api from '../api';

export default function SuperAdminHierarchy() {
  const [admins, setAdmins]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [openMap, setOpenMap] = useState({});

  useEffect(() => {
    async function fetchHierarchy() {
      try {
        setLoading(true);
        // calls GET https://vistapro-backend.onrender.com/api/super-admin/hierarchy
        const { data } = await api.get('/super-admin/hierarchy');
        setAdmins(data.admins);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchHierarchy();
  }, []);

  if (loading) return <p className="p-4 text-center">Loading…</p>;
  if (error)   return <p className="p-4 text-red-500 text-center">{error}</p>;

  return (
    <div className="space-y-4">
      {admins.map(admin => (
        <div key={admin.adminUniqueId} className="border rounded-lg">
          <button
            onClick={() => setOpenMap(m => ({ ...m, [admin.adminUniqueId]: !m[admin.adminUniqueId] }))}
            className="w-full flex justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold">
                {admin.firstName} {admin.lastName}
                <span className="ml-2 text-sm text-gray-500">({admin.adminUniqueId})</span>
              </p>
              <p className="text-sm text-gray-600">{admin.email}</p>
            </div>
            {openMap[admin.adminUniqueId]
              ? <ChevronDown size={20}/>
              : <ChevronRight size={20}/>}
          </button>
          {openMap[admin.adminUniqueId] && (
            <div className="bg-gray-50 p-4 border-t">
              {admin.marketers.length
                ? admin.marketers.map(m => (
                    <div key={m.uniqueId} className="p-2 bg-white rounded mb-2">
                      <p className="font-medium">
                        {m.firstName} {m.lastName}
                        <span className="ml-1 text-xs text-gray-500">({m.uniqueId})</span>
                      </p>
                      <p className="text-xs text-gray-600">{m.email}</p>
                    </div>
                  ))
                : <p className="text-sm text-gray-500">No marketers assigned.</p>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
