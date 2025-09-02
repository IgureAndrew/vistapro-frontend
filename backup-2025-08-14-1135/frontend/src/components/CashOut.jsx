import React, { useEffect, useState } from 'react';

function Cashout() {
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  // State for marketer report data
  const [marketerReports, setMarketerReports] = useState([]);
  const [filterTerm, setFilterTerm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMarketerReports = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/cashout/marketer-report`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch marketer reports");
        }
        const data = await res.json();
        setMarketerReports(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketerReports();
  }, [baseUrl, token]);

  // Filter reports based on marketer name or ID
  const filteredReports = marketerReports.filter(report => {
    const term = filterTerm.toLowerCase();
    return (
      report.marketerName.toLowerCase().includes(term) ||
      report.marketerId.toString().includes(term)
    );
  });

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">
        Marketer Earnings & Commission Report
      </h1>

      <div className="flex justify-center mb-8">
        <input
          type="text"
          placeholder="Search by marketer name or ID..."
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {error && (
        <div className="max-w-xl mx-auto text-center text-red-600 mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center">Loading reports...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map(report => (
            <div
              key={report.marketerId}
              className="p-6 rounded-lg shadow-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
            >
              <h2 className="text-2xl font-extrabold mb-2">
                {report.marketerName}
              </h2>
              <p className="mb-2">ID: <span className="font-bold">{report.marketerId}</span></p>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1">Earnings</h3>
                <div className="space-y-1">
                  <p>Daily: ₦{report.dailyEarnings}</p>
                  <p>Weekly: ₦{report.weeklyEarnings}</p>
                  <p>Monthly: ₦{report.monthlyEarnings}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1">Commission Breakdown</h3>
                <div className="space-y-1">
                  <p>Withdrawable (40%): ₦{report.withdrawableCommission}</p>
                  <p>Withheld (60%): ₦{report.nonWithdrawableCommission}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-bold text-lg mb-1">Top Devices Sold</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {report.mostlySoldDevices && report.mostlySoldDevices.length > 0 ? (
                    report.mostlySoldDevices.map((device, index) => (
                      <span
                        key={index}
                        className="bg-white text-indigo-600 px-3 py-1 rounded-full shadow-md"
                      >
                        {device.deviceCategory} ({device.count})
                      </span>
                    ))
                  ) : (
                    <span>No Data</span>
                  )}
                </div>
              </div>
              
              <p className="text-xs italic">
                Commission: ₦10,000 per Android & ₦15,000 per iPhone; 40% withdrawable immediately, 60% withheld till month-end.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Cashout;
