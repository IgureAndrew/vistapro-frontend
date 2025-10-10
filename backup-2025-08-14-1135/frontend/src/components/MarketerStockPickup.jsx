// src/components/MarketerStockPickup.jsx
import React, { useState, useEffect, useRef } from 'react'
import api from '../api'

export default function MarketerStockPickup() {
  const [dealers, setDealers]               = useState([])
  const [products, setProducts]             = useState([])
  const [selectedDealer, setSelectedDealer] = useState('')
  const [allowanceInfo, setAllowanceInfo]   = useState({
    allowance: 1,           // 1 or up to 3 once approved
    request_status: null,   // "pending" | "approved" | "rejected" | null
    next_request_at: null   // timestamp when next request is allowed
  })
  const [lines, setLines]                   = useState([{ product_id: '' }])
  const [pickups, setPickups]               = useState([])
  const [now, setNow]                       = useState(Date.now())
   // track the previous request_status
  const prevStatusRef  = useRef(allowanceInfo.request_status)
  const [transferringId, setTransferringId] = useState(null)
  const [transferTarget, setTransferTarget] = useState('')

  // 1s tick for live countdowns
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Initial load: dealers, allowance, pickups
  useEffect(() => {
    api.get('/stock/pickup/dealers')
      .then(r => setDealers(r.data.dealers || []))
      .catch(console.error)

    refreshAllowance()
    loadPickups()
  }, [])

  function refreshAllowance() {
    api.get('/stock/pickup/allowance')
      .then(r => {
        const {
          allowance,
          request_status,
          next_request_allowed_at
        } = r.data

        setAllowanceInfo({
          allowance,
          request_status,
          next_request_at: next_request_allowed_at
        })
      })
      .catch(console.error)
  }

  function loadPickups() {
    api.get('/stock/marketer')
      .then(r => setPickups(r.data.data || []))
      .catch(console.error)
  }

  // Auto-expand lines and alert once, but skip on the very first mount
  useEffect(() => {
    const prev = prevStatusRef.current
    const curr = allowanceInfo.request_status

    // only when we go from 'pending' → 'approved'
    if (prev === 'pending' && curr === 'approved') {
      // auto-expand to exactly allowance rows
      setLines(lines =>
        lines.length >= allowanceInfo.allowance
          ? lines
          : Array.from(
              { length: allowanceInfo.allowance },
              () => ({ product_id: '' })
            )
      )

      // show alert exactly on that transition
      alert(
        `Your request for additional pickup has been approved!\n` +
        `You can now pick up up to ${allowanceInfo.allowance} items.`
      )
    }

    // update prevStatus for next time
    prevStatusRef.current = curr
   }, [allowanceInfo.request_status, allowanceInfo.allowance])

  // Dealer → load products & reset lines
  function handleDealerChange(e) {
    const uid = e.target.value
    setSelectedDealer(uid)
    setProducts([])
    setLines([{ product_id: '' }])
    if (!uid) return

    api.get(`/stock/pickup/dealers/${uid}/products`)
      .then(r => setProducts(r.data.products || []))
      .catch(console.error)
  }

  // Add another line
  function addLine() {
    if (lines.length < allowanceInfo.allowance) {
      setLines([...lines, { product_id: '' }])
    }
  }

  // Update product selection
  function updateLine(idx, val) {
    const updated = [...lines]
    updated[idx] = { product_id: val }
    setLines(updated)
  }

  // Submit all pickups (qty = 1 each)
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedDealer) {
      return alert('Please select a dealer.')
    }
    // ensure every line has a product
    for (const { product_id } of lines) {
      if (!product_id) {
        return alert('Please choose a product on every line.')
      }
    }
    try {
      await Promise.all(lines.map(({ product_id }) =>
        api.post('/stock', {
          dealer_unique_id: selectedDealer,
          product_id,
          quantity: 1
        })
      ))
      alert('Pickup recorded!')
      // reset form
      setSelectedDealer('')
      setProducts([])
      setLines([{ product_id: '' }])
      refreshAllowance()
      loadPickups()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Error recording pickup')
    }
  }

  // Ask for extra pickup
  async function onRequestAdditional() {
    try {
      await api.post('/stock/pickup/request-additional')
      alert('Additional pickup requested—waiting for approval.')
      refreshAllowance()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Request failed')
    }
  }

  // Transfer & return handlers
  async function submitTransfer() {
    if (!transferTarget.trim()) return alert('Enter a target ID.')
    try {
      await api.post(`/stock/${transferringId}/transfer`, {
        targetIdentifier: transferTarget.trim()
      })
      alert('Transfer requested!')
      setTransferringId(null)
      setTransferTarget('')
      loadPickups()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Transfer failed')
    }
  }
  async function submitReturn(id) {
    try {
      await api.patch(`/stock/${id}/return-request`)
      alert('Return requested!')
      loadPickups()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.message || 'Return failed')
    }
  }

  // Countdown helper
  function formatRemaining(ms) {
    const hrs  = Math.floor(ms / 3600000)
    const mins = Math.floor((ms % 3600000) / 60000)
    const secs = Math.floor((ms % 60000) / 1000)
    return `${hrs}h ${mins}m ${secs}s`
  }

  const { allowance, request_status, next_request_at } = allowanceInfo
  const canAddMore = request_status === 'approved' && lines.length < allowance
  const rejectedCd = request_status === 'rejected' && next_request_at
    ? formatRemaining(new Date(next_request_at).getTime() - now)
    : null

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-center">Stock Pickup</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
        {/* Dealer selector */}
        <div>
          <label className="block mb-1 font-medium">Dealer</label>
          <select
            value={selectedDealer}
            onChange={handleDealerChange}
            className="w-full border p-2 rounded"
          >
            <option value="">— choose dealer —</option>
            {dealers.map(d => (
              <option key={d.unique_id} value={d.unique_id}>
                {d.business_name} ({d.location})
              </option>
            ))}
          </select>
        </div>

        {/* Product lines (qty fixed at 1) */}
        {lines.map((ln, i) => (
          <div key={i} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Product #{i+1}</label>
              <select
                value={ln.product_id}
                onChange={e => updateLine(i, e.target.value)}
                disabled={!selectedDealer}
                className="w-full border p-2 rounded"
              >
                <option value="">— choose product —</option>
                {products.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.device_name} {p.device_model} — {p.qty_available} avail.
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Quantity</label>
              <input
                type="number"
                value={1}
                readOnly
                className="w-full border p-2 rounded bg-gray-100 cursor-not-allowed"
              />
            </div>
          </div>
        ))}

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {canAddMore && (
            <button
              type="button"
              onClick={addLine}
              className="text-blue-600 hover:underline"
            >
              + Add another product
            </button>
          )}
          {allowance === 1 && request_status === null && (
            <button
              type="button"
              onClick={onRequestAdditional}
              className="ml-auto bg-gray-200 px-3 py-1 rounded"
            >
              Request Additional Pickup
            </button>
          )}
        </div>

        {/* Status messages */}
        {request_status === 'pending' && (
          <p className="text-blue-700">Waiting for Master Admin approval…</p>
        )}
        {request_status === 'rejected' && rejectedCd && (
          <p className="text-red-700">
            Your request was rejected. Try again in {rejectedCd}.
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Pick up
        </button>
      </form>

      {/* ── My Stock Pickups ────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Stock Pickups</h2>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-4">
          {pickups.length === 0
            ? <p className="text-gray-500">No pickups yet.</p>
            : pickups.map(s => {
                const diff      = new Date(s.deadline).getTime() - now
                const remaining = s.status === 'pending'
                  ? formatRemaining(diff)
                  : s.status === 'expired'
                    ? `${formatRemaining(-diff)} ago`
                    : '—'
                return (
                  <div key={s.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">
                        {s.device_name} {s.device_model}
                      </span>
                      <span className="text-sm text-gray-600">{s.status}</span>
                    </div>
                    <p className="text-sm"><strong>Qty:</strong> {s.quantity}</p>
                    <p className="text-xs text-gray-500">
                      <strong>Picked:</strong> {new Date(s.pickup_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      <strong>Remaining:</strong> {remaining}
                    </p>
                    {s.status === 'pending' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => { setTransferringId(s.id); setTransferTarget('') }}
                          className="flex-1 bg-yellow-500 text-white py-1 rounded"
                        >
                          Transfer
                        </button>
                        <button
                          onClick={() => submitReturn(s.id)}
                          className="flex-1 bg-red-500 text-white py-1 rounded"
                        >
                          Return
                        </button>
                      </div>
                    )}
                    {transferringId === s.id && (
                      <div className="mt-2 space-y-2">
                        <input
                          type="text"
                          placeholder="Target unique ID"
                          value={transferTarget}
                          onChange={e => setTransferTarget(e.target.value)}
                          className="w-full border p-2 rounded"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={submitTransfer}
                            className="flex-1 bg-green-500 text-white py-1 rounded"
                          >
                            Submit
                          </button>
                          <button
                            onClick={() => setTransferringId(null)}
                            className="flex-1 bg-gray-300 py-1 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
          }
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase">
              <tr>
                {['Device','Qty','Picked','Deadline','Remaining','Status','Actions']
                  .map(h => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))
                }
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pickups.length === 0
                ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      No pickups yet.
                    </td>
                  </tr>
                )
                : pickups.map(s => {
                    const diff      = new Date(s.deadline).getTime() - now
                    const remaining = s.status === 'pending'
                      ? formatRemaining(diff)
                      : s.status === 'expired'
                        ? `${formatRemaining(-diff)} ago`
                        : '—'
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {s.device_name} {s.device_model}
                        </td>
                        <td className="px-4 py-2">{s.quantity}</td>
                        <td className="px-4 py-2">
                          {new Date(s.pickup_date).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          {new Date(s.deadline).toLocaleString()}
                        </td>
                        <td className={`px-4 py-2 ${diff < 0 ? 'text-red-600' : ''}`}>
                          {remaining}
                        </td>
                        <td className="px-4 py-2">{s.status}</td>
                        <td className="px-4 py-2 space-x-2">
                          {s.status === 'pending' && (
                            <>
                              {transferringId === s.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Target ID"
                                    value={transferTarget}
                                    onChange={e => setTransferTarget(e.target.value)}
                                    className="border p-2 rounded"
                                  />
                                  <button
                                    onClick={submitTransfer}
                                    className="bg-green-500 text-white px-2 py-1 rounded"
                                  >
                                    Send
                                  </button>
                                  <button
                                    onClick={() => setTransferringId(null)}
                                    className="bg-gray-300 px-2 py-1 rounded"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setTransferringId(s.id); setTransferTarget('') }}
                                  className="bg-yellow-500 text-white px-2 py-1 rounded"
                                >
                                  Transfer
                                </button>
                              )}
                              <button
                                onClick={() => submitReturn(s.id)}
                                className="bg-red-500 text-white px-2 py-1 rounded"
                              >
                                Return
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
