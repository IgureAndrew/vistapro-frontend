// src/components/ProfitReport.jsx
import React, { useState, useEffect } from 'react'
import profitReportApi from '../api/profitReportApi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function ProfitReport() {
  // ─── Filters ────────────────────────────────────────────────────────────────
  const [startDate, setStartDate]   = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d })
  const [endDate, setEndDate]       = useState(new Date())
  const [deviceType, setDeviceType] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [loading, setLoading]       = useState(false)

  // ─── Data ───────────────────────────────────────────────────────────────────
  const [snapshot, setSnapshot]     = useState({ expected_profit_before: '0.00' })
  const [goals, setGoals]           = useState({ goal_units: 0, goal_profit_after: 0 })
  const [daily, setDaily]           = useState([])
  const [aggregated, setAggregated] = useState([])

  // format YYYY-MM-DD
  const fmt = d => d.toISOString().slice(0,10)

  // ─── Load static once ───────────────────────────────────────────────────────
  useEffect(() => {
    profitReportApi.get('/inventory-snapshot')
      .then(res => setSnapshot(res.data))
      .catch(console.error)

    profitReportApi.get('/goals')
      .then(res => setGoals(res.data))
      .catch(console.error)
  }, [])

  // ─── Fetch dynamic on filter ─────────────────────────────────────────────────
  const fetchReports = () => {
    setLoading(true)
    const params = {
      start: fmt(startDate),
      end:   fmt(endDate),
      ...(deviceType && { deviceType }),
      ...(deviceName && { deviceName })
    }

    profitReportApi.get('/aggregated', { params })
      .then(res => setAggregated(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(fetchReports, [])

  // ─── Totals ─────────────────────────────────────────────────────────────────
  const totalUnits = aggregated.reduce((sum, row) => sum + (row.total_units_sold || 0), 0)

  return (
    <div className="p-6 space-y-8">

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded shadow">
        <div>
          <label className="block text-sm">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={setStartDate}
            dateFormat="yyyy-MM-dd"
            className="mt-1 p-2 border rounded w-36"
          />
        </div>
        <div>
          <label className="block text-sm">End Date</label>
          <DatePicker
            selected={endDate}
            onChange={setEndDate}
            dateFormat="yyyy-MM-dd"
            className="mt-1 p-2 border rounded w-36"
          />
        </div>
        <div>
          <label className="block text-sm">Device Type</label>
          <select
            value={deviceType}
            onChange={e => setDeviceType(e.target.value)}
            className="mt-1 p-2 border rounded w-36"
          >
            <option value="">All</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm">Device Name</label>
          <input
            type="text"
            value={deviceName}
            onChange={e => setDeviceName(e.target.value)}
            placeholder="e.g. Galaxy A"
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Expected Profit Before</div>
          <div className="text-2xl font-bold">
            ₦{snapshot.expected_profit_before}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Expected Profit After</div>
          <div className="text-2xl font-bold">
            ₦{goals.goal_profit_after?.toFixed(2) || '0.00'}
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Units Goal</div>
          <div className="text-2xl font-bold">{goals.goal_units}</div>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <div className="text-sm text-gray-500">Units Sold</div>
          <div className="text-2xl font-bold">{totalUnits}</div>
        </div>
      </div>

      {/* Profit Over Time Chart */}
      <div className="bg-white p-4 rounded shadow h-64">
        <h2 className="text-xl font-semibold mb-2">Profit Over Time</h2>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={aggregated}>
            <XAxis dataKey="sale_day" />
            <YAxis />
            <Tooltip />
            <Line dataKey="total_initial_profit" stroke="#4f46e5" />
            <Line dataKey="total_final_profit"   stroke="#16a34a" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Aggregated Totals */}
      <div className="overflow-auto bg-white rounded shadow">
        <h2 className="text-xl font-semibold p-4 border-b">Daily Totals by Device</h2>
        <table className="min-w-full divide-y">
          <thead className="bg-gray-100">
            <tr>
              {[
                'Date','Type','Model','Name','Qty','Revenue',
                'Profit Before','Expenses','Profit After'
              ].map(h => (
                <th
                  key={h}
                  className="px-2 py-2 text-left text-xs uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {aggregated.map((r, i) => (
              <tr key={i}>
                <td className="px-2 py-1">{r.sale_day}</td>
                <td className="px-2 py-1">{r.device_type}</td>
                <td className="px-2 py-1">{r.device_model}</td>
                <td className="px-2 py-1">{r.device_name}</td>
                <td className="px-2 py-1">{r.total_units_sold}</td>
                <td className="px-2 py-1">₦{r.total_revenue}</td>
                <td className="px-2 py-1">₦{r.total_initial_profit}</td>
                <td className="px-2 py-1">₦{r.total_commission_expense}</td>
                <td className="px-2 py-1">₦{r.total_final_profit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
