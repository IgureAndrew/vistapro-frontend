import React, { useState, useEffect } from 'react';
import reportApi from '../api/reportApi';

const TABS = [
  { key: 'profit',          label: 'Profit',           endpoint: '/profit',                        metric: 'net_profit'    },
  { key: 'daily',           label: 'Daily Sales',      endpoint: '/sales/marketer?interval=daily',  metric: 'total_sales'   },
  { key: 'weekly',          label: 'Weekly Sales',     endpoint: '/sales/marketer?interval=weekly', metric: 'total_sales'   },
  { key: 'monthly',         label: 'Monthly Sales',    endpoint: '/sales/marketer?interval=monthly',metric: 'total_sales'   },
  { key: 'quarterly',       label: 'Quarterly Sales',  endpoint: '/sales/marketer?interval=quarterly',metric: 'total_sales'  },
  { key: 'yearly',          label: 'Yearly Sales',     endpoint: '/sales/marketer?interval=yearly', metric: 'total_sales'   },
  { key: 'deviceBreakdown', label: 'Device Breakdown', endpoint: '/device-sales?interval=daily',    metric: 'units_sold'    },
];

// Simple inline SVG Sparkline component
function Sparkline({ data, width = 100, height = 30, stroke = '#3182ce' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const len = data.length;
  const points = data.map((d, i) => {
    const x = (i / (len - 1)) * width;
    const y = height - (d / max) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export default function Reports() {
  const [allData, setAllData]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState(TABS[0].key);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all(
      TABS.map(tab =>
        reportApi.get(tab.endpoint)
          .then(res => ({ key: tab.key, data: res.data.data || [] }))
      )
    )
    .then(results => {
      const dataObj = {};
      results.forEach(r => { dataObj[r.key] = r.data; });
      setAllData(dataObj);
    })
    .catch(err => {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to load data');
    })
    .finally(() => setLoading(false));
  }, []);

  const activeConfig = TABS.find(t => t.key === activeTab);
  const chartData    = allData[activeTab] || [];
  const values       = chartData.map(d => d[activeConfig.metric]);
  const maxVal       = Math.max(...values, 1);

  return (
    <div className="p-6 space-y-6">
      {error && <div className="text-red-600">{error}</div>}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {TABS.map(tab => {
          const dataSet   = allData[tab.key] || [];
          const lastValue = dataSet.length ? dataSet[dataSet.length - 1][tab.metric] : 0;
          const sparkData = dataSet.map(d => d[tab.metric]).slice(-7);
          const isActive  = tab.key === activeTab;

          return (
            <div
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`cursor-pointer p-4 rounded-2xl transition-transform hover:scale-[1.02] ${isActive ? 'bg-white shadow-lg border-2 border-blue-500' : 'bg-gray-50'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm text-gray-500">{tab.label}</h3>
                  <p className="text-2xl font-bold">{new Intl.NumberFormat().format(lastValue)}</p>
                </div>
              </div>
              <div className="mt-3">
                <Sparkline data={sparkData} width={100} height={30} />
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS Bar Chart */}
      <div className="bg-white p-4 rounded-2xl shadow">
        {loading ? (
          <p>Loading chart…</p>
        ) : (
          chartData.length > 0 ? (
            <div className="w-full h-64 flex items-end space-x-2 px-2">
              {chartData.map((row, idx) => {
                const val           = row[activeConfig.metric];
                const heightPercent = (val / maxVal) * 100;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      title={`${new Date(row.period).toLocaleDateString()}: ${new Intl.NumberFormat().format(val)}`}
                      style={{ height: `${heightPercent}%` }}
                      className="w-4 bg-blue-500 rounded hover:bg-blue-600 transition-colors"
                    />
                    <span className="text-xs mt-1">
                      {new Date(row.period).toLocaleDateString().slice(0, 5)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">No {activeConfig.label.toLowerCase()} data to display.</p>
          )
        )}
      </div>

      {/* Data Table */}
      {!loading && !error && chartData.length > 0 && (
        <div className="overflow-auto bg-white rounded-2xl shadow p-4">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Period</th>
                <th className="px-4 py-2">{activeConfig.label}</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(row.period).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{new Intl.NumberFormat().format(row[activeConfig.metric])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
