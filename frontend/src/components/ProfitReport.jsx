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
  CartesianGrid,
} from 'recharts'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Sheet, SheetContent } from './ui/sheet'
import { CalendarDays, Download, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from './ui/chart'

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
  const [groupBy, setGroupBy]           = useState('daily') // kept for table CSV
     const [loading, setLoading]           = useState(false)
   const [aggregated, setAggregated]     = useState([])
   const [filtersOpen, setFiltersOpen]   = useState(false)
   
   // Pagination state
   const [currentPage, setCurrentPage]   = useState(1)
   const [rowsPerPage]                   = useState(15)

  // Helper to format YYYY-MM-DD for API calls
  const fmt = d => d.toISOString().slice(0, 10)
  
     // Helper to format dates for display
   const formatDisplayDate = (dateString) => {
     const date = new Date(dateString)
     
     // Check if the date has meaningful time information (not just midnight)
     const hours = date.getHours()
     const minutes = date.getMinutes()
     const seconds = date.getSeconds()
     
     const dateStr = date.toLocaleDateString('en-NG', { 
       day: '2-digit', 
       month: 'short', 
       year: 'numeric' 
     })
     
     // Only show time if it's not midnight (00:00:00)
     if (hours === 0 && minutes === 0 && seconds === 0) {
       return dateStr // Just show the date without time
     } else {
       const timeStr = date.toLocaleTimeString('en-NG', {
         hour: '2-digit',
         minute: '2-digit',
         hour12: true
       })
       return `${dateStr} ${timeStr}`
     }
   }

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
      
      // Debug: Log the first few records to see the actual data structure
      if (res.data && res.data.length > 0) {
        console.log('Sample sale_day data:', res.data.slice(0, 3).map(r => ({
          sale_day: r.sale_day,
          sale_day_type: typeof r.sale_day,
          sale_day_parsed: new Date(r.sale_day),
          sale_day_iso: new Date(r.sale_day).toISOString()
        })))
      }
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
    return `Week ${weekNo}, ${target.getFullYear()}`
  }

  function getMonthLabel(dateString) {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
  }

  // Build the “displayData” array based on daily/weekly/monthly grouping:
  const displayData = useMemo(() => {
    if (!aggregated.length) return []

    if (groupBy === 'daily') {
      return aggregated.map(r => ({
        period:  r.sale_timestamp || r.sale_day, // Use timestamp if available, fallback to date
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

   // Pagination logic
   const totalPages = Math.ceil(displayData.length / rowsPerPage)
   const startIndex = (currentPage - 1) * rowsPerPage
   const endIndex = startIndex + rowsPerPage
   const paginatedData = displayData.slice(startIndex, endIndex)
   
   // Reset to first page when data changes
   useEffect(() => {
     setCurrentPage(1)
   }, [displayData])


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

  // shadcn chart config and stacked dataset
  const chartConfig = {
    grossProfit: { label: 'Gross Profit', color: '#92400e' },
    netProfit:  { label: 'Net Profit',  color: '#92400e' },
  }

  const stackedDaily = useMemo(() => {
    const map = new Map()
    aggregated.forEach((r) => {
      const day = r.sale_day
      const grossProfit = Number(r.total_initial_profit || 0)
      const netProfit = Number(r.total_final_profit || 0)
      if (!map.has(day)) map.set(day, { period: formatDisplayDate(day), grossProfit: 0, netProfit: 0 })
      map.get(day).grossProfit += grossProfit
      map.get(day).netProfit += netProfit
    })
    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period))
  }, [aggregated])
  const money = (n) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(n || 0))

  // Top selling products (by units) - up to 10
  const topSellingProducts = useMemo(() => {
    const bucket = new Map()
    aggregated.forEach(r => {
      const key = `${r.device_name ?? 'Device'}|${r.device_model ?? ''}`
      bucket.set(key, (bucket.get(key) || 0) + Number(r.total_units_sold || 0))
    })
    
    // Convert to array and sort by units sold (descending)
    const products = Array.from(bucket.entries()).map(([key, units]) => {
      const [name, model] = key.split('|')
      return { name, model, units }
    }).sort((a, b) => b.units - a.units)
    
    // Return top 10 products
    return products.slice(0, 10)
  }, [aggregated])

  // Optional status summary (fallbacks if endpoint not available)
  const [statusSummary, setStatusSummary] = useState({
    new: 0, progress: 0, completed: 0, returned: 0,
    changes: { new: 0.5, progress: -0.3, completed: 2.0, returned: 0.5 },
  })
  useEffect(() => {
    (async () => {
      try {
        const res = await profitReportApi.get('/status-summary', { params: { start: fmt(startDate), end: fmt(endDate) } })
        if (res.data) setStatusSummary(res.data)
      } catch { /* ignore optional */ }
    })()
  }, [startDate, endDate])

  //
  // ─── 3) Conditional Rendering ───────────────────────────────────────────────
  //
  // Because **all hooks** have already run above, React’s hook order is now consistent.
  // We simply choose which “screen” to return.

  if (!unlocked) {
    // “LOCK SCREEN” → ask for access code (no card wrapper)
    return (
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-10">
        <div className="max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-center mb-1">Enter Profit Report Access Code</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">This protects sensitive financial information.</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={accessCode}
              onChange={e => setAccessCode(e.target.value)}
              placeholder="Access code"
              className="w-full border rounded-md px-3 py-2 bg-background border-border"
              disabled={unlockLoading}
            />
            {unlockError && (
              <p className="text-sm text-red-600">{unlockError}</p>
            )}
            <Button type="submit" className="w-full h-11" disabled={unlockLoading}>
              {unlockLoading ? 'Checking…' : 'Unlock Report'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // “UNLOCKED” → show the actual Profit Report UI
  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-6 space-y-6">
             {/* Clean, focused header */}
       <div className="space-y-4">
         <div className="flex items-center justify-end">
           <Button onClick={() => exportCsv(displayData, groupBy)} size="lg" className="shadow-lg">
             <Download className="w-4 h-4 mr-2"/> Export Report
           </Button>
         </div>
         
         {/* Quick date summary */}
         <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg w-fit">
           <CalendarDays className="w-4 h-4" />
           <span>Showing data from <span className="font-medium text-foreground">{startDate.toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric'})}</span> to <span className="font-medium text-foreground">{endDate.toLocaleDateString('en-NG', { day:'2-digit', month:'short', year:'numeric'})}</span></span>
         </div>
       </div>
      {/* Mobile sticky toolbar */}
      <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">Filters</div>
          <Button className="h-10 px-3" variant="outline" onClick={() => setFiltersOpen(true)}>Open</Button>
        </div>
      </div>

             {/* Enhanced Mobile Sheet with filters */}
       <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
         <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto p-6">
           <div className="space-y-6">
             <div className="text-center">
               <h3 className="text-lg font-semibold">Filter Options</h3>
               <p className="text-sm text-muted-foreground">Customize your data view</p>
             </div>
             <div className="grid gap-4">
               <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Start Date</label>
                 <DatePicker 
                   selected={startDate} 
                   onChange={setStartDate} 
                   dateFormat="dd MMM yyyy" 
                   className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">End Date</label>
                 <DatePicker 
                   selected={endDate} 
                   onChange={setEndDate} 
                   dateFormat="dd MMM yyyy" 
                   className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Device Type</label>
                 <select 
                   value={deviceType} 
                   onChange={e => setDeviceType(e.target.value)} 
                   className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                 >
                   <option value="">All Types</option>
                   <option value="android">Android</option>
                   <option value="ios">iOS</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Device Name</label>
                 <input 
                   type="text" 
                   value={deviceName} 
                   onChange={e => setDeviceName(e.target.value)} 
                   placeholder="e.g. Galaxy A" 
                   className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-muted-foreground mb-2">Group By</label>
                 <select 
                   value={groupBy} 
                   onChange={e => setGroupBy(e.target.value)} 
                   className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                 >
                   <option value="daily">Daily</option>
                   <option value="weekly">Weekly</option>
                   <option value="monthly">Monthly</option>
                 </select>
               </div>
               <Button 
                 className="h-12 w-full" 
                 onClick={() => { setFiltersOpen(false); fetchReports(); }} 
                 disabled={loading}
               >
                 {loading ? 'Loading…' : 'Apply Filters'}
               </Button>
             </div>
           </div>
         </SheetContent>
       </Sheet>

             {/* Enhanced desktop filters */}
       <div className="hidden md:block">
         <div className="bg-card border rounded-xl p-6 shadow-sm">
           <div className="flex items-center gap-2 mb-4">
             <div className="w-2 h-2 bg-primary rounded-full"></div>
             <h3 className="font-semibold text-lg">Filter Options</h3>
           </div>
           <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 items-end">
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Start Date</label>
               <DatePicker 
                 selected={startDate} 
                 onChange={setStartDate} 
                 dateFormat="dd MMM yyyy" 
                 className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">End Date</label>
               <DatePicker 
                 selected={endDate} 
                 onChange={setEndDate} 
                 dateFormat="dd MMM yyyy" 
                 className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Device Type</label>
               <select 
                 value={deviceType} 
                 onChange={e => setDeviceType(e.target.value)} 
                 className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
               >
                 <option value="">All Types</option>
                 <option value="android">Android</option>
                 <option value="ios">iOS</option>
               </select>
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Device Name</label>
               <Input 
                 type="text" 
                 value={deviceName} 
                 onChange={e => setDeviceName(e.target.value)} 
                 placeholder="e.g. Galaxy A" 
                 className="p-3 h-auto focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" 
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-muted-foreground mb-2">Group By</label>
               <select 
                 value={groupBy} 
                 onChange={e => setGroupBy(e.target.value)} 
                 className="w-full p-3 border rounded-lg bg-background border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
               >
                 <option value="daily">Daily</option>
                 <option value="weekly">Weekly</option>
                 <option value="monthly">Monthly</option>
               </select>
             </div>
             <Button 
               onClick={fetchReports} 
               disabled={loading} 
               className="h-12 px-6 shadow-lg hover:shadow-xl transition-shadow"
             >
               {loading ? 'Loading…' : 'Apply Filters'}
             </Button>
           </div>
         </div>
       </div>

      {/* Chart + KPI grid (no cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Left: Profit chart (further reduced width) */}
         <section className="lg:col-span-5">
           <h2 className="text-lg font-semibold mb-1">Profit Chart</h2>
           <p className="text-sm text-muted-foreground mb-3">Last 28 days</p>
          <ChartContainer config={chartConfig} className="h-72 rounded-xl bg-card shadow p-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedDaily} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent config={chartConfig} valueFormatter={(v)=>money(v)} />} />
                <ChartLegend content={<ChartLegendContent config={chartConfig} />} />
                <Bar dataKey="grossProfit" name="Gross Profit" stackId="a" fill="#92400e" radius={[4,4,0,0]} />
                <Bar dataKey="netProfit"  name="Net Profit"  stackId="a" fill="#92400e"  radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </section>

                 {/* Right side: KPI cards stack (wider) */}
         <div className="col-span-12 lg:col-span-7 grid grid-rows-2 gap-4">
           {/* Row 1: two KPI cards */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <KpiCard title="Total Units" value={grandTotals.units.toLocaleString()} delta={0} />
             <KpiCard title="Total Revenue" value={`₦${grandTotals.revenue.toLocaleString()}`} delta={0} />
           </div>
           {/* Row 2: three KPI cards */}
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
             <KpiCard title="Gross Profit" value={`₦${grandTotals.before.toLocaleString()}`} delta={0} />
             <KpiCard title="Expenses" value={`₦${grandTotals.expense.toLocaleString()}`} delta={0} />
             <KpiCard title="Net Profit" value={`₦${grandTotals.after.toLocaleString()}`} delta={0} />
           </div>
         </div>
      </div>

      {/* Row below: Best Seller + Track Order Status on the same row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Top Selling Products */}
         <div className="col-span-12 lg:col-span-5 rounded-xl bg-card shadow p-4">
           <div className="font-medium mb-3">Top Selling Products</div>
           <div className="space-y-2 max-h-64 overflow-y-auto">
             {topSellingProducts.length > 0 ? (
               topSellingProducts.map((product, index) => (
                 <div key={index} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/40">
                   <div className="flex items-center gap-3">
                     <div className="h-8 w-8 rounded-full bg-muted grid place-items-center text-xs font-medium">
                       {index + 1}
                     </div>
                     <div>
                       <div className="font-medium leading-tight text-sm">
                         {product.name} {product.model && <span className="text-muted-foreground">({product.model})</span>}
                       </div>
                       <div className="text-xs text-muted-foreground">Rank #{index + 1}</div>
                     </div>
                   </div>
                   <div className="text-sm">
                     <span className="font-medium">{product.units.toLocaleString()}</span> items sold
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center text-muted-foreground py-4">
                 No products data available
               </div>
             )}
           </div>
         </div>

        {/* Track Order Status */}
        <div className="col-span-12 lg:col-span-7 rounded-xl bg-card shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Track Order Status</div>
              <div className="text-xs text-muted-foreground">Analyze growth and changes in visitor patterns</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <StatusStat label="New Order"   count={statusSummary.new}       change={statusSummary.changes?.new}       barClass="bg-blue-500" />
            <StatusStat label="On Progress" count={statusSummary.progress}  change={statusSummary.changes?.progress}  barClass="bg-yellow-500" />
            <StatusStat label="Completed"   count={statusSummary.completed} change={statusSummary.changes?.completed} barClass="bg-green-600" />
            <StatusStat label="Return"      count={statusSummary.returned}  change={statusSummary.changes?.returned}  barClass="bg-red-500" />
          </div>
        </div>
      </div>

      {/* Details table row below */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="col-span-12 rounded-xl bg-card shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold">Details</h2>
              <p className="text-sm text-muted-foreground">Aggregated rows grouped {groupBy}.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => window.print()}>Print</Button>
              <Button variant="outline" onClick={() => exportCsv(displayData, groupBy)}>Export CSV</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    {groupBy === 'daily' ? 'Date' : groupBy === 'weekly' ? 'Week Period' : 'Month Period'}
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Units</th>
                  {groupBy === 'daily' && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Device</th>}
                  {groupBy === 'daily' && <th className="px-4 py-3 text-left font-medium text-muted-foreground">Model</th>}
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Gross Profit</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Expenses</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                                 {paginatedData.map((row, idx) => (
                   <tr key={idx} className="hover:bg-muted/40">
                     <td className="px-4 py-3">
                       {groupBy === 'daily' ? formatDisplayDate(row.period) : row.period}
                     </td>
                     <td className="px-4 py-3 text-right">{row.units}</td>
                     {groupBy === 'daily' && <td className="px-4 py-3">{row.device}</td>}
                     {groupBy === 'daily' && <td className="px-4 py-3">{row.model}</td>}
                     <td className="px-4 py-3 text-right">₦{row.revenue.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right">₦{row.before.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right">₦{row.expense.toLocaleString()}</td>
                     <td className="px-4 py-3 text-right">₦{row.after.toLocaleString()}</td>
                   </tr>
                 ))}
                                 {paginatedData.length === 0 && displayData.length > 0 && (
                   <tr>
                     <td colSpan={groupBy==='daily'?8:6} className="px-4 py-6 text-center text-muted-foreground">No data on this page.</td>
                   </tr>
                 )}
                 {displayData.length === 0 && (
                   <tr>
                     <td colSpan={groupBy==='daily'?8:6} className="px-4 py-6 text-center text-muted-foreground">No data for this range.</td>
                   </tr>
                 )}
              </tbody>
                         </table>
           </div>
           
           {/* Pagination */}
           {displayData.length > 0 && (
             <div className="flex items-center justify-between mt-4 px-4 py-3 border-t">
               <div className="text-sm text-muted-foreground">
                 Showing {startIndex + 1} to {Math.min(endIndex, displayData.length)} of {displayData.length} entries
               </div>
               <div className="flex items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                   disabled={currentPage === 1}
                 >
                   Previous
                 </Button>
                 <div className="flex items-center gap-1">
                   {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                     let pageNum
                     if (totalPages <= 5) {
                       pageNum = i + 1
                     } else if (currentPage <= 3) {
                       pageNum = i + 1
                     } else if (currentPage >= totalPages - 2) {
                       pageNum = totalPages - 4 + i
                     } else {
                       pageNum = currentPage - 2 + i
                     }
                     
                     return (
                       <Button
                         key={pageNum}
                         variant={currentPage === pageNum ? "default" : "outline"}
                         size="sm"
                         className="w-8 h-8 p-0"
                         onClick={() => setCurrentPage(pageNum)}
                       >
                         {pageNum}
                       </Button>
                     )
                   })}
                 </div>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                   disabled={currentPage === totalPages}
                 >
                   Next
                 </Button>
               </div>
             </div>
           )}
         </section>
       </div>

      {/* end grid */}
    </div>
  )
}

// Helpers
function exportCsv(rows, groupBy) {
  const headers = [
    groupBy === 'daily' ? 'Date' : groupBy === 'weekly' ? 'Week Period' : 'Month Period',
    'Units',
    ...(groupBy === 'daily' ? ['Device', 'Model'] : []),
    'Revenue','Gross Profit','Expenses','Net Profit'
  ]
  const csv = [headers.join(',')]
  rows.forEach(r => {
    const base = [r.period, r.units]
    const rest = groupBy === 'daily' ? [r.device, r.model] : []
    csv.push([...base, ...rest, r.revenue, r.before, r.expense, r.after].join(','))
  })
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'profit-report.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// UI helpers
function MiniStat({ label, value }) {
  return (
    <div className="text-right">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold leading-none">{Number(value || 0).toLocaleString()}</div>
    </div>
  )
}

function KpiCard({ className = '', title, value, delta = 0 }) {
  const up = Number(delta) >= 0
  return (
    <div className={`rounded-xl border bg-card shadow-sm p-4 min-w-0 ${className}`}>
      <div className="text-sm text-muted-foreground truncate">{title}</div>
      <div className="mt-1 text-2xl font-semibold break-words leading-tight min-w-0">{value}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(Number(delta) || 0).toFixed(1)}%</span>
        <span className="text-muted-foreground">Compare from last period</span>
      </div>
    </div>
  )
}

function StatusStat({ label, count = 0, change = 0, barClass = 'bg-primary' }) {
  const up = Number(change) >= 0
  const pct = Math.max(0, Math.min(100, Number(count || 0)))
  return (
    <div className="rounded-lg border p-3">
      <div className="text-2xl font-semibold leading-none">{Number(count || 0).toLocaleString()}</div>
      <div className="text-sm">{label}</div>
      <div className={`mt-1 inline-flex items-center gap-1 text-xs ${up ? 'text-green-600' : 'text-red-600'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{Math.abs(Number(change) || 0).toFixed(1)}%</span>
      </div>
      <div className="mt-2 h-2 w-full rounded bg-muted overflow-hidden">
        <div className={`h-2 ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
