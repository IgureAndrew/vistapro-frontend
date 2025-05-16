import React, { useState } from 'react';
import profitApi from '../api/profitReportApi';

export default function ProfitReport() {
  const [range, setRange] = useState({ from:'', to:'' });
  const [report, setReport] = useState(null);
  const [error,  setError]  = useState('');

  const load = async () => {
    try {
      setError('');
      const res = await profitApi.get('/', { params: range });
      setReport(res.data);
    } catch {
      setError('Failed to load profit report');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Date Range */}
      <div className="flex items-center space-x-2">
        <input
          type="date"
          value={range.from}
          onChange={e=>setRange(r=>({...r,from:e.target.value}))}
          className="border p-2"
        />
        <span>to</span>
        <input
          type="date"
          value={range.to}
          onChange={e=>setRange(r=>({...r,to:e.target.value}))}
          className="border p-2"
        />
        <button
          onClick={load}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >Generate</button>
      </div>
      {error && <p className="text-red-600">{error}</p>}

      {report && (
        <>
          {/* Expected Inventory Profit */}
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold">Expected Inventory Profit</h2>
            <p className="text-2xl">
              ₦{report.expectedInventoryProfit.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              Goal Progress: {report.goalProgress}% 
            </p>
            <div className="w-full bg-gray-200 h-2 rounded">
              <div
                className="bg-indigo-600 h-2 rounded"
                style={{ width: `${report.goalProgress}%` }}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ['Gross Profit', report.totals.gross_profit],
              ['Commission Expense', report.totals.commission_expense],
              ['Net Profit', report.totals.net_profit],
            ].map(([label, val]) => (
              <div key={label} className="bg-white rounded shadow p-4">
                <h3 className="text-sm text-gray-500">{label}</h3>
                <p className="text-xl font-semibold">
                  ₦{val.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Breakdown Table */}
          <div className="overflow-auto bg-white rounded shadow p-4">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  {['Date','Product','Type','Qty','Gross','Expense','Net']
                    .map(h=> <th key={h} className="px-4 py-2">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {report.breakdown.map((r,i)=>(
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{r.sale_date}</td>
                    <td className="px-4 py-2">{r.device_name}</td>
                    <td className="px-4 py-2">{r.device_type}</td>
                    <td className="px-4 py-2">{r.total_qty}</td>
                    <td className="px-4 py-2">
                      ₦{r.gross_profit.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      ₦{r.commission_expense.toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      ₦{r.net_profit.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {!report.breakdown.length && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No sales in this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
