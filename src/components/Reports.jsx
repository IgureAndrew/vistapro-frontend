// src/components/Reports.jsx
import React, { useState, useEffect } from 'react';
import reportApi from '../api/reportApi';

const TABS = [
  { key: 'profit',         label: 'Profit',            endpoint: '/reports/profit' },
  { key: 'daily',          label: 'Daily Sales',      endpoint: '/reports/sales/daily' },
  { key: 'weekly',         label: 'Weekly Sales',     endpoint: '/reports/sales/weekly' },
  { key: 'monthly',        label: 'Monthly Sales',    endpoint: '/reports/sales/monthly' },
  { key: 'quarterly',      label: 'Quarterly Sales',  endpoint: '/reports/sales/quarterly' },
  { key: 'yearly',         label: 'Yearly Sales',     endpoint: '/reports/sales/yearly' },
  { key: 'deviceBreakdown',label: 'Device Breakdown', endpoint: '/reports/device-breakdown' },
];

export default function Reports() {
  const [activeTab, setActiveTab]     = useState(TABS[0].key);
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  useEffect(() => {
    const tab = TABS.find(t => t.key === activeTab);
    if (!tab) return;

    setLoading(true);
    setError('');
    setData(null);

    reportApi.get(tab.endpoint)
      .then(res => {
        setData(res.data);
      })
      .catch(err => {
        console.error(err);
        setError(err.response?.data?.message || err.message || 'Failed to load');
      })
      .finally(() => setLoading(false));

  }, [activeTab]);

  return (
    <div className="p-6 space-y-4">
      {/* Tab buttons */}
      <nav className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={
              `px-4 py-2 rounded ${
                tab.key === activeTab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`
            }
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content area */}
      <section className="bg-white p-4 rounded shadow min-h-[200px]">
        {loading && <p>Loading {TABS.find(t => t.key===activeTab).label}…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && data && (
          <pre className="overflow-auto text-sm whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>
    </div>
  );
}
