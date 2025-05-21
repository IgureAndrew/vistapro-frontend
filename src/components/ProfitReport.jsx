import React, { useState, useEffect, useMemo, useCallback } from 'react'
import profitReportApi from '../api/profitReportApi'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'

export default function ProfitReport() {
  // ─── Filters ────────────────────────────────────────────────────────────────
  const [startDate, setStartDate]   = useState(() => { const d = new Date(); d.setDate(d.getDate() - 7); return d })
  const [endDate, setEndDate]       = useState(new Date())
  const [deviceType, setDeviceType] = useState('')
  const [deviceName, setDeviceName] = useState('')
  const [groupBy, setGroupBy]       = useState('daily') // 'daily'|'weekly'|'monthly'
  const [loading, setLoading]       = useState(false)

  // ─── Data ───────────────────────────────────────────────────────────────────
  const [aggregated, setAggregated] = useState([])

  // format YYYY-MM-DD helper
  const fmt = d => d.toISOString().slice(0,10)

  // ─── Fetch aggregated on filter apply ────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        start: fmt(startDate),
        end:   fmt(endDate),
        ...(deviceType && { deviceType }),
        ...(deviceName && { deviceName })
      }
      const res = await profitReportApi.get('/aggregated', { params })
      setAggregated(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, deviceType, deviceName])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  // weekly/monthly grouping helpers
  function getWeekLabel(dateString) {
    const d = new Date(dateString)
    const target = new Date(d.valueOf())
    const dayNr = (d.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    const yearStart = new Date(target.getFullYear(),0,1).valueOf()
    const weekNo = 1 + Math.round((firstThursday - yearStart) / (7 * 864e5))
    return `${target.getFullYear()}-W${String(weekNo).padStart(2,'0')}`
  }
  function getMonthLabel(dateString) {
    const d = new Date(dateString)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
  }

  // ─── Prepare display rows ───────────────────────────────────────────────────
  const displayData = useMemo(() => {
    if (!aggregated.length) return []

    if (groupBy === 'daily') {
      return aggregated.map(r => ({
        period:  r.sale_day,
        units:   Number(r.total_units_sold),
        device:  r.device_name,
        model:   r.device_model,
        revenue: Number(r.total_revenue),
        before:  Number(r.total_initial_profit),
        expense: Number(r.total_commission_expense),
        after:   Number(r.total_final_profit)
      }))
    }

    const bucket = {}
    aggregated.forEach(r => {
      const key = groupBy === 'weekly'
        ? getWeekLabel(r.sale_day)
        : getMonthLabel(r.sale_day)
      if (!bucket[key]) {
        bucket[key] = { period: key, units:0, revenue:0, before:0, expense:0, after:0 }
      }
      bucket[key].units   += Number(r.total_units_sold)
      bucket[key].revenue += Number(r.total_revenue)
      bucket[key].before  += Number(r.total_initial_profit)
      bucket[key].expense += Number(r.total_commission_expense)
      bucket[key].after   += Number(r.total_final_profit)
    })

    return Object.values(bucket).sort((a,b) => a.period.localeCompare(b.period))
  }, [aggregated, groupBy])

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
        <div>
          <label className="block text-sm">Group By</label>
          <select
            value={groupBy}
            onChange={e => setGroupBy(e.target.value)}
            className="mt-1 p-2 border rounded w-36"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Loading…' : 'Apply Filters'}
        </button>
      </div>

      {/* Summary Table */}
      <div className="bg-white p-4 rounded shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                {groupBy === 'daily' ? 'Date' : groupBy === 'weekly' ? 'Week' : 'Month'}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Units Sold</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Device</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Profit Before</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Net Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {displayData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-gray-700">{row.period}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{row.units}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{row.device}</td>
                <td className="px-3 py-2 text-sm text-gray-700">{row.model}</td>
                <td className="px-3 py-2 text-sm text-gray-700">₦{row.revenue.toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-gray-700">₦{row.before.toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-gray-700">₦{row.expense.toLocaleString()}</td>
                <td className="px-3 py-2 text-sm text-gray-700">₦{row.after.toLocaleString()}</td>
              </tr>
            ))}
            {displayData.length===0 && (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-500">
                  No data for this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-4 rounded shadow h-64">
        <h2 className="text-xl font-semibold mb-2">Profit Over Time</h2>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip formatter={val => `₦${val.toLocaleString()}`} />
            <Legend />
            <Bar dataKey="before" name="Profit Before" fill="#4f46e5" />
            <Bar dataKey="after"  name="Net Profit"   fill="#16a34a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
