import React, { useEffect, useState } from "react";

function Verification() {
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [verifiedMarketers, setVerifiedMarketers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVerifications = async () => {
      setLoading(true);
      try {
        // Fetch pending verifications
        const resPending = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/pending`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resPending.ok) throw new Error("Failed to fetch pending verifications");
        const dataPending = await resPending.json();
        setPendingVerifications(dataPending.data || []);

        // Fetch verified marketers
        const resApproved = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/approved`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resApproved.ok) throw new Error("Failed to fetch verified marketers");
        const dataApproved = await resApproved.json();
        setVerifiedMarketers(dataApproved.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVerifications();
  }, [baseUrl, token]);

  const handleApprove = async (marketer_id) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/approve/${marketer_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Approval failed");
      alert("Verification approved.");
      // Remove from pending list
      setPendingVerifications(prev => prev.filter(v => v.marketer_id !== marketer_id));
      // Append to verified list (for simplicity, using the pending record data)
      const approvedRecord = pendingVerifications.find(v => v.marketer_id === marketer_id);
      setVerifiedMarketers(prev => [...prev, { ...approvedRecord, approved: true, reviewed_at: new Date() }]);
    } catch (err) {
      alert(err.message);
    }
  };

  // Combine both pending and verified for a single list
  const allVerifications = [...pendingVerifications, ...verifiedMarketers];
  // Sort by submission date descending (most recent first)
  allVerifications.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">Verification</h1>
      {error && <p className="text-red-600 text-center mb-4">{error}</p>}
      {loading ? (
        <p className="text-center">Loading verifications...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {allVerifications.map(item => (
            <div
              key={item.marketer_id}
              className="p-6 rounded-xl shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              <h2 className="text-2xl font-bold mb-2">{item.marketer_name}</h2>
              <p className="mb-1">ID: {item.marketer_id}</p>
              <p className="mb-1">Email: {item.marketer_email}</p>
              <p className="mb-1">Submitted: {new Date(item.submitted_at).toLocaleString()}</p>
              {item.approved ? (
                <span className="mt-2 inline-block bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold">
                  Verified
                </span>
              ) : (
                <button
                  onClick={() => handleApprove(item.marketer_id)}
                  className="mt-4 w-full bg-white text-green-600 font-bold py-2 px-4 rounded hover:bg-green-100"
                >
                  Approve Verification
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Verification;
