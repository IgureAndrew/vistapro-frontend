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
  //
  // ─── 1) “Unlock” Hooks ────────────────────────────────────────────────────
  //
  // These four hooks must always run, on every render, in this order:
  const [unlocked, setUnlocked]           = useState(false)
  const [accessCode, setAccessCode]       = useState('')
  const [unlockError, setUnlockError]     = useState(null)
  const [unlockLoading, setUnlockLoading] = useState(false)

  async function handleUnlock(e) {
    e.preventDefault()
    setUnlockError(null)
    setUnlockLoading(true)
    try {
      //  – Make a POST to your new “/api/profit-report/unlock” endpoint:
      //    e.g. server will verify `{ code: accessCode }` and return 200 if valid,
      //    or 401/403 if not.
      await profitReportApi.post('/unlock', { code: accessCode })

      // If no error was thrown, mark as unlocked
      setUnlocked(true)
    } catch (err) {
      // If the server returned a 401/403, show a message:
      if (err.response?.status === 401) {
        setUnlockError('Incorrect access code.')
      } else {
        setUnlockError('Server error. Please try again.')
      }
    } finally {
      setUnlockLoading(false)
    }
  }

  //
  // ─── 2) “Profit Report” Hooks ─────────────────────────────────────────────
  //
  // These hooks also must always run (in the same order) on every render,
  // even if we’re currently “locked out” and showing only the code form.
  const [startDate, setStartDate]       = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d
  })
  const [endDate, setEndDate]           = useState(new Date())
  const [deviceType, setDeviceType]     = useState('')
  const [deviceName, setDeviceName]     = useState('')
  const [groupBy, setGroupBy]           = useState('daily') // 'daily' | 'weekly' | 'monthly'
  const [loading, setLoading]           = useState(false)
  const [aggregated, setAggregated]     = useState([])

  // Helper to format YYYY-MM-DD
  const fmt = d => d.toISOString().slice(0, 10)

  // Fetch data when filters change
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

  // Helpers for weekly/monthly labels:
  function getWeekLabel(dateString) {
    const d = new Date(dateString)
    const target = new Date(d.valueOf())
    const dayNr = (d.getDay() + 6) % 7
    target.setDate(target.getDate() - dayNr + 3)
    const firstThursday = target.valueOf()
    const yearStart = new Date(target.getFullYear(), 0, 1).valueOf()
    const weekNo = 1 + Math.round((firstThursday - yearStart) / (7 * 864e5))
    return `${target.getFullYear()}-W${String(weekNo).padStart(2, '0')}`
  }

  function getMonthLabel(dateString) {
    const d = new Date(dateString)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  // Build the “displayData” array based on daily/weekly/monthly grouping:
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
        bucket[key] = { period: key, units: 0, revenue: 0, before: 0, expense: 0, after: 0 }
      }

      bucket[key].units   += Number(r.total_units_sold)
      bucket[key].revenue += Number(r.total_revenue)
      bucket[key].before  += Number(r.total_initial_profit)
      bucket[key].expense += Number(r.total_commission_expense)
      bucket[key].after   += Number(r.total_final_profit)
    })

    return Object.values(bucket).sort((a, b) => a.period.localeCompare(b.period))
  }, [aggregated, groupBy])


  // Grand totals over whatever is in displayData
const grandTotals = useMemo(() => (
  displayData.reduce((tot, row) => ({
    units:   tot.units   + row.units,
    revenue: tot.revenue + row.revenue,
    before:  tot.before  + row.before,
    expense: tot.expense + row.expense,
    after:   tot.after   + row.after,
  }), { units: 0, revenue: 0, before: 0, expense: 0, after: 0 })
), [displayData])

  //
  // ─── 3) Conditional Rendering ───────────────────────────────────────────────
  //
  // Because **all hooks** have already run above, React’s hook order is now consistent.
  // We simply choose which “screen” to return.

  if (!unlocked) {
    // “LOCK SCREEN” → ask for access code
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <form
          onSubmit={handleUnlock}
          className="bg-white p-8 rounded shadow w-full max-w-sm space-y-4"
        >
          <h2 className="text-xl font-semibold text-center">
            Enter Profit Report Access Code
          </h2>

          <input
            type="password"
            value={accessCode}
            onChange={e => setAccessCode(e.target.value)}
            placeholder="Access code"
            className="w-full border p-2 rounded"
            disabled={unlockLoading}
          />

          {unlockError && (
            <p className="text-red-600 text-sm">{unlockError}</p>
          )}

          <button
            type="submit"
            disabled={unlockLoading}
            className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-50"
          >
            {unlockLoading ? 'Checking…' : 'Unlock Report'}
          </button>
        </form>
      </div>
    )
  }

  // “UNLOCKED” → show the actual Profit Report UI
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
         {/* Grand Totals */}
<div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 mb-6">
  {[
    { label: 'Total Units',    value: grandTotals.units },
    { label: 'Total Revenue',  value: `₦${grandTotals.revenue.toLocaleString()}` },
    { label: 'Profit Before',  value: `₦${grandTotals.before.toLocaleString()}` },
    { label: 'Expenses',       value: `₦${grandTotals.expense.toLocaleString()}` },
    { label: 'Net Profit',     value: `₦${grandTotals.after.toLocaleString()}` },
  ].map(({ label, value }) => (
    <div key={label} className="flex-1 min-w-[120px]">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  ))}
</div>
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
