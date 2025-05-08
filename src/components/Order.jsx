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
  const [form, setForm]             = useState({
    number_of_devices: "",
    bnpl_platform:     "",
    customer_name:     "",
    customer_phone:    "",
    customer_address:  ""
  });
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlaceData();
    fetchOrders();
  }, []);

  async function fetchPlaceData() {
    try {
      const res  = await fetch(PLACE_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlaceData(data);
      setSelectedId("");
      setForm({
        number_of_devices: "",
        bnpl_platform:     "",
        customer_name:     "",
        customer_phone:    "",
        customer_address:  ""
      });
      setErrors({});
    } catch (e) {
      alert(e.message || "Could not load order form");
    }
  }

  async function fetchOrders() {
    try {
      const res  = await fetch(HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setOrders(data.orders);
    } catch (e) {
      alert(e.message || "Could not load your orders");
    }
  }

  function handleSelectChange(e) {
    setSelectedId(e.target.value);
    setForm(fs => ({ ...fs, number_of_devices: "" }));
    setErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(fs => ({ ...fs, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (!isStockMode) {
      if (!form.number_of_devices || Number(form.number_of_devices) < 1) {
        errs.number_of_devices = "Enter a valid quantity";
      }
    }
    if (!form.bnpl_platform)     errs.bnpl_platform    = "Select a BNPL platform";
    if (!form.customer_name.trim())    errs.customer_name    = "Customer name is required";
    if (!/^[0-9]{7,15}$/.test(form.customer_phone))    errs.customer_phone   = "Enter a valid phone number";
    if (!form.customer_address.trim()) errs.customer_address = "Customer address is required";
    setErrors(errs);
    return !Object.keys(errs).length;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!selectedId) {
      return alert("Please select an item first.");
    }
    if (!validate()) return;

    const record = isStockMode
      ? placeData.pending.find(p => p.stock_update_id === +selectedId)
      : placeData.products.find(p => p.product_id === +selectedId);

    const qty = isStockMode
      ? 1
      : parseInt(form.number_of_devices, 10);

    const sold_amount = Number(record.selling_price) * qty;
    const body = isStockMode
      ? {
          stock_update_id:   record.stock_update_id,
          number_of_devices: qty,
          sold_amount,
          bnpl_platform:     form.bnpl_platform,
          customer_name:     form.customer_name,
          customer_phone:    form.customer_phone,
          customer_address:  form.customer_address
        }
      : {
          product_id:        record.product_id,
          number_of_devices: qty,
          sold_amount,
          bnpl_platform:     form.bnpl_platform,
          customer_name:     form.customer_name,
          customer_phone:    form.customer_phone,
          customer_address:  form.customer_address
        };

    setSubmitting(true);
    try {
      const res = await fetch(PLACE_URL, {
        method: "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data);
      alert("Order placed successfully!");
      await fetchPlaceData();
      await fetchOrders();
    } catch (err) {
      alert(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!placeData) {
    return <div className="p-4">Loading form…</div>;
  }

  const isStockMode = placeData.mode === "stock" && placeData.pending.length > 0;
  const options     = isStockMode ? placeData.pending : placeData.products;
  const selected    = selectedId
    ? (isStockMode
        ? placeData.pending.find(p => p.stock_update_id === +selectedId)
        : placeData.products.find(p => p.product_id === +selectedId))
    : null;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl font-bold">Place Order</h2>

        {isStockMode && (
          <p className="text-yellow-700 bg-yellow-100 p-2 rounded">
            ⚠️ You have pending stock pickups—use your reserved stock.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select */}
          <div>
            <label className="block font-semibold mb-1">
              {isStockMode ? "Select Pickup" : "Select Product"}
            </label>
            <select
              value={selectedId}
              onChange={handleSelectChange}
              disabled={submitting}
              className={`w-full border rounded px-3 py-2 ${
                submitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
              required
            >
              <option value="">-- choose --</option>
              {options.map(o =>
                isStockMode ? (
                  <option
                    key={o.stock_update_id}
                    value={o.stock_update_id}
                  >
                    [{o.qty_reserved}] {o.device_name} {o.device_model}
                  </option>
                ) : (
                  <option
                    key={o.product_id}
                    value={o.product_id}
                  >
                    [{o.qty_available} available] {o.device_name} {o.device_model}
                  </option>
                )
              )}
            </select>
          </div>

          {selected && (
            <>
            {/* Dealer & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Dealer</label>
                <input
                  readOnly
                  value={selected.dealer_name}
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Location</label>
                <input
                  readOnly
                  value={selected.dealer_location}
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
            </div>

            {/* Device Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {["device_name","device_model","device_type","selling_price"].map((f,i) => (
                <div key={i}>
                  <label className="block font-semibold mb-1">
                    {f.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                  </label>
                  <input
                    readOnly
                    value={selected[f]}
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
              ))}
            </div>

            {/* IMEI if stock mode */}
            {isStockMode && (
              <div>
                <label className="block font-semibold mb-1">IMEI</label>
                <textarea
                  readOnly
                  rows={1}
                  value={(selected.imeis_reserved || [])[0] || ""}
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
            )}

            {/* Quantity */}
            {isStockMode ? (
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  name="number_of_devices"
                  value={1}
                  readOnly
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold mb-1">Quantity</label>
                <input
                  type="number"
                  name="number_of_devices"
                  min="1"
                  max={selected.qty_available}
                  value={form.number_of_devices}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  } ${errors.number_of_devices ? "border-red-500" : ""}`}
                  required
                />
                {errors.number_of_devices && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.number_of_devices}
                  </p>
                )}
              </div>
            )}

            {/* BNPL Platform */}
            <div>
              <label className="block font-semibold mb-1">BNPL Platform</label>
              <select
                name="bnpl_platform"
                value={form.bnpl_platform}
                onChange={handleChange}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${
                  submitting ? "opacity-50 cursor-not-allowed" : ""
                } ${errors.bnpl_platform ? "border-red-500" : ""}`}
                required
              >
                <option value="">None</option>
                <option value="WATU">WATU</option>
                <option value="EASYBUY">EASYBUY</option>
                <option value="CREDIT DIRECT">CREDIT DIRECT</option>
              </select>
              {errors.bnpl_platform && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.bnpl_platform}
                </p>
              )}
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1">Customer Name</label>
                <input
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  } ${errors.customer_name ? "border-red-500" : ""}`}
                  required
                />
                {errors.customer_name && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.customer_name}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-semibold mb-1">Customer Phone</label>
                <input
                  name="customer_phone"
                  value={form.customer_phone}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  } ${errors.customer_phone ? "border-red-500" : ""}`}
                  required
                />
                {errors.customer_phone && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.customer_phone}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block font-semibold mb-1">Customer Address</label>
                <input
                  name="customer_address"
                  value={form.customer_address}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${
                    submitting ? "opacity-50 cursor-not-allowed" : ""
                  } ${errors.customer_address ? "border-red-500" : ""}`}
                  required
                />
                {errors.customer_address && (
                  <p className="text-red-600 text-sm mt-1">
                    {errors.customer_address}
                  </p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className={`mt-4 font-bold px-6 py-2 rounded ${
                submitting
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-black text-[#FFD700]"
              }`}
            >
              {submitting ? "Placing..." : "Place Order"}
            </button>
            </>
          )}

        </form>
      </div>

      {/* Your Orders */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["#","Device","Model","Qty","Amount","Date","Status"].map((h,i) => (
                  <th
                    key={i}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase"
                  >
                    {h}
                  </th>
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
                  <td className="px-4 py-2 text-sm">
                    {new Date(o.sale_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm">{o.status || "pending"}</td>
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
