// src/components/Order.jsx
import React, { useState, useEffect } from "react";

export default function Order() {
  const API_ROOT    = import.meta.env.VITE_API_URL + "/api/marketer";
  const PLACE_URL   = `${API_ROOT}/orders`;
  const HISTORY_URL = `${API_ROOT}/orders/history`;
  const token       = localStorage.getItem("token") || "";

  const [placeData, setPlaceData]   = useState(null);
  const [orders, setOrders]         = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [formState, setFormState]   = useState({
    number_of_devices: "",
    bnpl_platform:     "",
    customer_name:     "",
    customer_phone:    "",
    customer_address:  "",
  });
  // errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPlaceData();
    fetchOrders();
  }, []);

  async function fetchPlaceData() {
    try {
      const res = await fetch(PLACE_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
      const data = await res.json();
      setPlaceData(data);
      setSelectedId("");
      setFormState({
        number_of_devices: "",
        bnpl_platform:     "",
        customer_name:     "",
        customer_phone:    "",
        customer_address:  "",
      });
      setErrors({});
    } catch (err) {
      console.error("fetchPlaceData:", err);
      alert(err.message || "Could not load order form");
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      console.error("fetchOrders:", err);
      alert(err.message || "Could not load your orders");
    }
  }

  const handleSelectChange = e => {
    setSelectedId(e.target.value);
    setFormState(fs => ({ ...fs, number_of_devices: "" }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormState(fs => ({ ...fs, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    const { number_of_devices, bnpl_platform, customer_name, customer_phone, customer_address } = formState;
    if (!number_of_devices || Number(number_of_devices) < 1) {
      errs.number_of_devices = 'Enter a valid quantity';
    }
    if (!bnpl_platform) {
      errs.bnpl_platform = 'Select a BNPL platform';
    }
    if (!customer_name.trim()) {
      errs.customer_name = 'Customer name is required';
    }
    if (!/^[0-9]{7,15}$/.test(customer_phone)) {
      errs.customer_phone = 'Enter a valid phone number';
    }
    if (!customer_address.trim()) {
      errs.customer_address = 'Customer address is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedId) return alert("Please select an item first.");
    if (!validate()) {
      return; // stop on validation errors
    }
    const record = placeData.mode === "stock"
      ? placeData.pending.find(p => p.stock_update_id === +selectedId)
      : placeData.products.find(p => p.product_id === +selectedId);
    const qty   = parseInt(formState.number_of_devices, 10);
    const price = Number(record.selling_price);
    const sold_amount = price * qty;

    const body = placeData.mode === "stock"
      ? {
          stock_update_id:   record.stock_update_id,
          number_of_devices: qty,
          sold_amount,
          bnpl_platform:     formState.bnpl_platform,
          customer_name:     formState.customer_name,
          customer_phone:    formState.customer_phone,
          customer_address:  formState.customer_address,
        }
      : {
          product_id:        record.product_id,
          number_of_devices: qty,
          sold_amount,
          bnpl_platform:     formState.bnpl_platform,
          customer_name:     formState.customer_name,
          customer_phone:    formState.customer_phone,
          customer_address:  formState.customer_address,
        };

    try {
      const res = await fetch(PLACE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(await res.text() || `Error ${res.status}`);
      alert("Order placed successfully!");
      fetchPlaceData();
      fetchOrders();
    } catch (err) {
      console.error("handleSubmit:", err);
      alert(err.message || "Failed to place order");
    }
  }

  if (!placeData) return <div className="p-4">Loading form…</div>;

  const selected = selectedId
    ? (placeData.mode === "stock"
        ? placeData.pending.find(p => p.stock_update_id === +selectedId)
        : placeData.products.find(p => p.product_id === +selectedId))
    : null;

  const allImeis = selected
    ? (placeData.mode === "stock"
        ? selected.imeis_reserved || []
        : selected.imeis_available || [])
    : [];
  const qty = parseInt(formState.number_of_devices, 10) || 0;
  const displayedImeis = allImeis.slice(0, qty);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Place Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-semibold mb-1">Select {placeData.mode === "stock" ? "Pickup" : "Product"}</label>
            <select
              value={selectedId}
              onChange={handleSelectChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- choose --</option>
              {placeData.mode === "stock"
                ? placeData.pending.map(p => (
                    <option key={p.stock_update_id} value={p.stock_update_id}>
                      [{p.qty_reserved}] {p.device_name} {p.device_model}
                    </option>
                  ))
                : placeData.products.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.qty_available} available] {p.device_name} {p.device_model}
                    </option>
                  ))}
            </select>
          </div>

          {selected && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['device_name','device_model','device_type','selling_price'].map((field, i) => (
                  <div key={i}>
                    <label className="block font-semibold mb-1">
                      {field.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                    </label>
                    <input
                      readOnly
                      value={selected[field]}
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                    />
                  </div>
                ))}
              </div>

              {displayedImeis.length > 0 && (
                <div>
                  <label className="block font-semibold mb-1">
                    IMEI{qty>1?'s':''} (showing {qty})
                  </label>
                  <textarea
                    readOnly
                    rows={Math.min(5, displayedImeis.length)}
                    value={displayedImeis.join("\n")}
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    name="number_of_devices"
                    min="1"
                    max={placeData.mode === "stock" ? selected.qty_reserved : selected.qty_available}
                    value={formState.number_of_devices}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${errors.number_of_devices ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.number_of_devices && <p className="mt-1 text-red-600 text-sm">{errors.number_of_devices}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">BNPL Platform</label>
                  <select
                    name="bnpl_platform"
                    value={formState.bnpl_platform}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${errors.bnpl_platform ? 'border-red-500' : ''}`}
                    required
                  >
                    <option value="">None</option>
                    <option value="WATU">WATU</option>
                    <option value="EASYBUY">EASYBUY</option>
                    <option value="CREDIT DIRECT">CREDIT DIRECT</option>
                  </select>
                  {errors.bnpl_platform && <p className="mt-1 text-red-600 text-sm">{errors.bnpl_platform}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Customer Name</label>
                  <input
                    name="customer_name"
                    value={formState.customer_name}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${errors.customer_name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.customer_name && <p className="mt-1 text-red-600 text-sm">{errors.customer_name}</p>}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Customer Phone</label>
                  <input
                    name="customer_phone"
                    value={formState.customer_phone}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${errors.customer_phone ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.customer_phone && <p className="mt-1 text-red-600 text-sm">{errors.customer_phone}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Customer Address</label>
                  <input
                    name="customer_address"
                    value={formState.customer_address}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${errors.customer_address ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.customer_address && <p className="mt-1 text-red-600 text-sm">{errors.customer_address}</p>}
                </div>
              </div>

              <button type="submit" className="mt-4 bg-black text-[#FFD700] font-bold px-6 py-2 rounded">
                Place Order
              </button>
            </>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['#','Device','Model','Qty','Amount','Date','Status'].map((h,i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-semibold uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{o.id}</td>
                  <td className="px-4 py-2 text-sm">{o.device_name}</td>
                  <td className="px-4 py-2 text-sm">{o.device_model}</td>
                  <td className="px-4 py-2 text-sm">{o.number_of_devices}</td>
                  <td className="px-4 py-2 text-sm">{o.sold_amount}</td>
                  <td className="px-4 py-2 text-sm">{new Date(o.sale_date).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">{o.status || 'pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 font-medium">No orders found.</p>
        )}
      </div>
    </div>
  );
}
