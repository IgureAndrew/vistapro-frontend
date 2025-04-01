// src/components/Submissions.jsx
import React, { useState, useEffect } from "react";

function Submissions() {
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/verification/submissions`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch submissions");
        }
        const data = await res.json();
        setSubmissions(data.submissions);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, []);

  if (loading) return <p>Loading submissions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Submissions</h2>
      {/* You can display each type in separate sections */}
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Biodata Submissions</h3>
        {submissions.biodata && submissions.biodata.length > 0 ? (
          <ul className="list-disc pl-6">
            {submissions.biodata.map((item) => (
              <li key={item.id}>
                {item.name} - Submitted on {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No biodata submissions yet.</p>
        )}
      </section>
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Guarantor Submissions</h3>
        {submissions.guarantor && submissions.guarantor.length > 0 ? (
          <ul className="list-disc pl-6">
            {submissions.guarantor.map((item) => (
              <li key={item.id}>
                Guarantor for marketer ID {item.marketer_id} - Submitted on {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No guarantor submissions yet.</p>
        )}
      </section>
      <section className="mb-6">
        <h3 className="text-xl font-semibold mb-2">Commitment Submissions</h3>
        {submissions.commitment && submissions.commitment.length > 0 ? (
          <ul className="list-disc pl-6">
            {submissions.commitment.map((item) => (
              <li key={item.id}>
                Commitment for marketer ID {item.marketer_id} - Submitted on {new Date(item.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No commitment submissions yet.</p>
        )}
      </section>
    </div>
  );
}

export default Submissions;
