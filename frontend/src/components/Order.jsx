// src/components/Order.jsx
import React, { useState, useEffect } from "react";

export default function Order() {
  const API_ROOT    = import.meta.env.VITE_API_URL + "/api/marketer";
  const PLACE_URL   = `${API_ROOT}/orders`;
  const HISTORY_URL = `${API_ROOT}/orders/history`;
  const token       = localStorage.getItem("token") || "";

  // state
  const [pending,  setPending]  = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [imeis,            setImeis]            = useState([]);

  const [form, setForm] = useState({
    bnpl_platform:   "",
    customer_name:   "",
    customer_phone:  "",
    customer_address:""
  });
  const [errors,     setErrors]     = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      await Promise.all([loadPending(), loadOrders()]);
      setLoading(false);
    })();
  }, []);

  async function loadPending() {
    const res  = await fetch(PLACE_URL, { headers:{ Authorization:`Bearer ${token}` }});
    const data = await res.json();
    setPending(data.pending || []);
  }

  async function loadOrders() {
    const res  = await fetch(HISTORY_URL, { headers:{ Authorization:`Bearer ${token}` }});
    const data = await res.json();
    setOrders(data.orders || []);
  }

  const selectedPickup = pending.find(p => p.stock_update_id === +selectedPickupId);

  function handlePickupChange(e) {
    const id = e.target.value;
    setSelectedPickupId(id);
    setErrors({});
    if (!id) return setImeis([]);
    const count = pending.find(p=>p.stock_update_id===+id)?.qty_reserved||0;
    setImeis(Array(count).fill(""));
  }

  function handleImeiChange(i, v) {
    setImeis(a => {
      const c = [...a]; c[i]=v; return c;
    });
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (!selectedPickupId)           errs.pickup = "Select a pickup";
    if (!imeis.length)               errs.imeis  = "Enter at least one IMEI";
    else if (imeis.some(i=>!/^\d{15}$/.test(i)))
                                     errs.imeis  = "Every IMEI must be 15 digits";

    if (!form.bnpl_platform)         errs.bnpl_platform   = "Select a BNPL platform";
    if (!form.customer_name.trim())  errs.customer_name   = "Customer name is required";
    if (!/^[0-9]{7,15}$/.test(form.customer_phone))
                                     errs.customer_phone  = "Enter a valid phone number";
    if (!form.customer_address.trim())
                                     errs.customer_address = "Customer address is required";

    setErrors(errs);
    return !Object.keys(errs).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !validate()) return;

    const body = {
      stock_update_id:   +selectedPickupId,
      number_of_devices: imeis.length,
      imeis,
      bnpl_platform:     form.bnpl_platform,
      customer_name:     form.customer_name,
      customer_phone:    form.customer_phone,
      customer_address:  form.customer_address,
    };

    setSubmitting(true);
    const res = await fetch(PLACE_URL, {
      method: "POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to place order");
      setSubmitting(false);
      return;
    }

    alert("Order placed!");
    await Promise.all([loadPending(), loadOrders()]);
    setSubmitting(false);
    setSelectedPickupId(""); setImeis([]); setForm({
      bnpl_platform:"", customer_name:"", customer_phone:"", customer_address:""
    });
  }

  if (loading) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* ── PLACE ORDER ───────────────── */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-2xl font-bold">Place Order</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pickup selector */}
          <div>
            <label className="block mb-1 font-medium">Select Pickup</label>
            <select
              value={selectedPickupId}
              onChange={handlePickupChange}
              disabled={!pending.length || submitting}
              className="w-full border p-2 rounded"
            >
              <option value="">— choose one —</option>
              {pending.map(p => (
                <option key={p.stock_update_id} value={p.stock_update_id}>
                  [{p.qty_reserved}] {p.device_name} {p.device_model} — {p.dealer_name}
                </option>
              ))}
            </select>
            {errors.pickup && <p className="text-red-600 mt-1">{errors.pickup}</p>}
          </div>

          {/* Show selected pickup’s details */}
          {selectedPickup && (
            <div className="bg-gray-50 p-3 rounded space-y-1">
              <p><strong>Device:</strong> {selectedPickup.device_name} {selectedPickup.device_model}</p>
              <p><strong>Type:</strong> {selectedPickup.device_type}</p>
              <p><strong>Dealer:</strong> {selectedPickup.dealer_name} ({selectedPickup.dealer_location})</p>
            </div>
          )}

          {/* IMEI inputs */}
          {imeis.map((val,i) => (
            <div key={i}>
              <label className="block mb-1 font-medium">IMEI #{i+1}</label>
              <input
                type="text"
                value={val}
                maxLength={15}
                onChange={e=>handleImeiChange(i,e.target.value)}
                disabled={submitting}
                className="w-full border p-2 rounded"
                placeholder="Enter 15-digit IMEI"
              />
            </div>
          ))}
          {errors.imeis && <p className="text-red-600">{errors.imeis}</p>}

          {/* BNPL */}
          <div>
            <label className="block mb-1 font-medium">BNPL Platform</label>
            <select
              name="bnpl_platform"
              value={form.bnpl_platform}
              onChange={handleFormChange}
              disabled={submitting}
              className="w-full border p-2 rounded"
            >
              <option value="">None</option>
              <option>WATU</option>
              <option>EASYBUY</option>
              <option>CREDIT DIRECT</option>
            </select>
            {errors.bnpl_platform && <p className="text-red-600 mt-1">{errors.bnpl_platform}</p>}
          </div>

          {/* Customer info */}
          <div>
            <label className="block mb-1 font-medium">Customer Name</label>
            <input
              name="customer_name"
              value={form.customer_name}
              onChange={handleFormChange}
              disabled={submitting}
              className="w-full border p-2 rounded"
            />
            {errors.customer_name && <p className="text-red-600 mt-1">{errors.customer_name}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium">Customer Phone</label>
            <input
              name="customer_phone"
              value={form.customer_phone}
              onChange={handleFormChange}
              disabled={submitting}
              className="w-full border p-2 rounded"
            />
            {errors.customer_phone && <p className="text-red-600 mt-1">{errors.customer_phone}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium">Customer Address</label>
            <textarea
              name="customer_address"
              value={form.customer_address}
              onChange={handleFormChange}
              disabled={submitting}
              className="w-full border p-2 rounded"
            />
            {errors.customer_address && <p className="text-red-600 mt-1">{errors.customer_address}</p>}
          </div>

          <button
            type="submit"
            disabled={!pending.length || submitting}
            className={`w-full py-2 rounded text-white ${
              !pending.length || submitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {submitting ? "Placing…" : "Place Order"}
          </button>
        </form>
      </section>

      {/* ── YOUR ORDERS ───────────────── */}
      <section>
        <h3 className="text-xl font-bold mb-2">Your Orders</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                {["#","Device","Model","Qty","Amount","Date","Status"].map(h=>(
                  <th key={h} className="border px-2 py-1 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id}>
                  <td className="border px-2 py-1">{o.id}</td>
                  <td className="border px-2 py-1">{o.device_name}</td>
                  <td className="border px-2 py-1">{o.device_model}</td>
                  <td className="border px-2 py-1">{o.number_of_devices}</td>
                  <td className="border px-2 py-1">
                    ₦{Number(o.sold_amount).toLocaleString()}
                  </td>
                  <td className="border px-2 py-1">{new Date(o.sale_date).toLocaleDateString()}</td>
                  <td className="border px-2 py-1 capitalize">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
