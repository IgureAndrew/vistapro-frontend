// src/components/Order.jsx
import React, { useState, useEffect } from "react";

export default function Order() {
  const API_ROOT       = import.meta.env.VITE_API_URL + "/api/marketer";
  const PLACE_URL      = `${API_ROOT}/orders`;
  const HISTORY_URL    = `${API_ROOT}/orders/history`;
  const DEALERS_URL    = `${API_ROOT}/dealers`;
  const DEALER_PRODS   = dealerUid => `${API_ROOT}/dealers/${dealerUid}/products`;
  const token          = localStorage.getItem("token") || "";

  // form data
  const [placeData, setPlaceData]    = useState(null);
  const [orders,    setOrders]       = useState([]);
  const [loading,   setLoading]      = useState(true);
  const [errors,    setErrors]       = useState({});
  const [submitting, setSubmitting]  = useState(false);

  // stock‐mode
  const [selectedPickupId, setSelectedPickupId] = useState("");

  // free‐mode
  const [dealers,           setDealers]           = useState([]);
  const [selectedDealer,    setSelectedDealer]    = useState("");
  const [dealerProducts,    setDealerProducts]    = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // shared form fields
  const [form, setForm] = useState({
    number_of_devices: "",
    bnpl_platform:     "",
    customer_name:     "",
    customer_phone:    "",
    customer_address:  ""
  });

  useEffect(() => {
    (async () => {
      try {
        await fetchPlaceData();
        await fetchOrders();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function fetchPlaceData() {
    const res  = await fetch(PLACE_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load order form");
    setPlaceData(data);

    // reset
    setErrors({});
    setSubmitting(false);
    setSelectedPickupId("");
    setSelectedDealer("");
    setSelectedProductId("");
    setDealerProducts([]);
    setForm({
      number_of_devices: "",
      bnpl_platform:     "",
      customer_name:     "",
      customer_phone:    "",
      customer_address:  ""
    });

    if (data.mode === "free") {
      const r = await fetch(DEALERS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      if (r.ok) setDealers(j.dealers);
    }
  }

  async function fetchOrders() {
    const res  = await fetch(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to load your orders");
    setOrders(data.orders);
  }

  async function handleDealerChange(e) {
    const uid = e.target.value;
    setSelectedDealer(uid);
    setSelectedProductId("");
    setDealerProducts([]);
    if (!uid) return;
    const res  = await fetch(DEALER_PRODS(uid), { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (res.ok) setDealerProducts(data.products);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function validate() {
    const errs = {};
    if (placeData.mode === "free") {
      if (!selectedDealer)           errs.dealer = "Select a dealer";
      if (!selectedProductId)        errs.product = "Select a product";
      if (!form.number_of_devices || Number(form.number_of_devices) < 1)
        errs.number_of_devices = "Enter a valid quantity";
    } else {
      if (!selectedPickupId)         errs.pickup = "Select a pickup";
    }
    if (!form.bnpl_platform)         errs.bnpl_platform    = "Select a BNPL platform";
    if (!form.customer_name.trim())  errs.customer_name    = "Customer name is required";
    if (!/^[0-9]{7,15}$/.test(form.customer_phone))
                                    errs.customer_phone   = "Enter a valid phone number";
    if (!form.customer_address.trim()) errs.customer_address = "Customer address is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    const body = {
      bnpl_platform:    form.bnpl_platform,
      customer_name:    form.customer_name,
      customer_phone:   form.customer_phone,
      customer_address: form.customer_address,
      number_of_devices: placeData.mode==="free"
        ? Number(form.number_of_devices)
        : 1, // always 1 in stock mode
    };

    if (placeData.mode === "stock") {
      body.stock_update_id = Number(selectedPickupId);
    } else {
      body.product_id  = Number(selectedProductId);
      const prod = dealerProducts.find(p => p.product_id === +selectedProductId);
      body.sold_amount = prod.selling_price * body.number_of_devices;
    }

    setSubmitting(true);
    const res  = await fetch(PLACE_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Failed to place order");
      setSubmitting(false);
      return;
    }
    alert("Order placed successfully!");
    await fetchPlaceData();
    await fetchOrders();
  }

  if (loading || !placeData) return <div className="p-4">Loading…</div>;

  const isStockMode = placeData.mode === "stock" && placeData.pending.length > 0;
  const selectedPickup = isStockMode
    ? placeData.pending.find(p => p.stock_update_id === +selectedPickupId)
    : null;

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">

      {/* ── PLACE ORDER ───────────────────────── */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl font-bold">Place Order</h2>

        {isStockMode && (
          <p className="text-yellow-700 bg-yellow-100 p-2 rounded">
            ⚠️ You have pending stock pickups—use your reserved stock.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {isStockMode
            ? (
              <div>
                <label className="block font-semibold mb-1">Select Pickup</label>
                <select
                  value={selectedPickupId}
                  onChange={e => setSelectedPickupId(e.target.value)}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${errors.pickup ? "border-red-500" : ""}`}
                >
                  <option value="">-- choose --</option>
                  {placeData.pending.map(p => (
                    <option key={p.stock_update_id} value={p.stock_update_id}>
                      {/* show dealer_name & dealer_location */}
                      [{p.qty_reserved}] {p.device_name} {p.device_model} —{" "}
                      {p.dealer_name} ({p.dealer_location})
                    </option>
                  ))}
                </select>
                {errors.pickup && <p className="text-red-600 text-sm">{errors.pickup}</p>}

                {/* show IMEIs when one is selected */}
                {selectedPickup && selectedPickup.imeis_reserved?.length > 0 && (
                  <div className="mt-2 bg-gray-50 p-3 rounded">
                    <p className="font-semibold mb-1">Reserved IMEIs</p>
                    <ul className="list-disc list-inside text-sm">
                      {selectedPickup.imeis_reserved.map(imei => (
                        <li key={imei}>{imei}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )
            : (
              <>
                {/* free‐mode dealer */}
                <div>
                  <label className="block font-semibold mb-1">Select Dealer</label>
                  <select
                    value={selectedDealer}
                    onChange={handleDealerChange}
                    disabled={submitting}
                    className={`w-full border rounded px-3 py-2 ${errors.dealer ? "border-red-500" : ""}`}
                  >
                    <option value="">-- choose dealer --</option>
                    {dealers.map(d => (
                      <option key={d.unique_id} value={d.unique_id}>
                        {d.business_name} ({d.location})
                      </option>
                    ))}
                  </select>
                  {errors.dealer && <p className="text-red-600 text-sm">{errors.dealer}</p>}
                </div>

                {/* free‐mode product */}
                {selectedDealer && (
                  <div>
                    <label className="block font-semibold mb-1">Select Product</label>
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
                      disabled={submitting}
                      className={`w-full border rounded px-3 py-2 ${errors.product ? "border-red-500" : ""}`}
                    >
                      <option value="">-- choose product --</option>
                      {dealerProducts.map(p => (
                        <option key={p.product_id} value={p.product_id}>
                          [{p.qty_available}] {p.device_name} {p.device_model}
                        </option>
                      ))}
                    </select>
                    {errors.product && <p className="text-red-600 text-sm">{errors.product}</p>}
                  </div>
                )}

                {/* free‐mode quantity */}
                {selectedProductId && (
                  <div>
                    <label className="block font-semibold mb-1">Quantity</label>
                    <input
                      type="number"
                      name="number_of_devices"
                      min="1"
                      max={
                        dealerProducts.find(p => p.product_id === +selectedProductId)
                          ?.qty_available || 1
                      }
                      value={form.number_of_devices}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full border rounded px-3 py-2 ${errors.number_of_devices ? "border-red-500" : ""}`}
                    />
                    {errors.number_of_devices && (
                      <p className="text-red-600 text-sm">{errors.number_of_devices}</p>
                    )}
                  </div>
                )}

                {/* show available IMEIs */}
                {selectedProductId && (() => {
  const prod = dealerProducts.find(p => p.product_id === +selectedProductId);
  if (!prod?.imeis_available?.length) return null;

  // parse out how many the user requested
  const qty = parseInt(form.number_of_devices, 10) || 0;
  // take at most qty, capped by availability
  const shownImeis = prod.imeis_available.slice(0, qty);

  return (
    <div className="mt-2">
      <label className="block font-semibold mb-1">
        Available IMEIs {qty > shownImeis.length && `(only ${shownImeis.length} available)`}
      </label>
      <textarea
        readOnly
        rows={Math.min(shownImeis.length, 6)}
        value={shownImeis.join('\n')}
        className="w-full border rounded px-3 py-2 bg-gray-100 whitespace-pre-wrap"
      />
    </div>
  );
})()}
              </>
            )
          }

          {/* BNPL */}
          <div>
            <label className="block font-semibold mb-1">BNPL Platform</label>
            <select
              name="bnpl_platform"
              value={form.bnpl_platform}
              onChange={handleChange}
              disabled={submitting}
              className={`w-full border rounded px-3 py-2 ${errors.bnpl_platform ? "border-red-500" : ""}`}
            >
              <option value="">None</option>
              <option value="WATU">WATU</option>
              <option value="EASYBUY">EASYBUY</option>
              <option value="CREDIT DIRECT">CREDIT DIRECT</option>
            </select>
            {errors.bnpl_platform && <p className="text-red-600 text-sm">{errors.bnpl_platform}</p>}
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
                className={`w-full border rounded px-3 py-2 ${errors.customer_name ? "border-red-500" : ""}`}
              />
              {errors.customer_name && <p className="text-red-600 text-sm">{errors.customer_name}</p>}
            </div>
            <div>
              <label className="block font-semibold mb-1">Customer Phone</label>
              <input
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${errors.customer_phone ? "border-red-500" : ""}`}
              />
              {errors.customer_phone && <p className="text-red-600 text-sm">{errors.customer_phone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold mb-1">Customer Address</label>
              <input
                name="customer_address"
                value={form.customer_address}
                onChange={handleChange}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${errors.customer_address ? "border-red-500" : ""}`}
              />
              {errors.customer_address && <p className="text-red-600 text-sm">{errors.customer_address}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`mt-4 w-full py-2 font-bold rounded ${
              submitting
                ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                : "bg-black text-[#FFD700]"
            }`}
          >
            {submitting ? "Placing..." : "Place Order"}
          </button>
        </form>
      </div>

      {/* ── YOUR ORDERS ───────────────────────── */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["#","Device","Model","Qty","Amount","Date","Status"].map((h,i) => (
                  <th key={i} className="px-4 py-2 text-left text-xs font-semibold uppercase">
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
                  <td className="px-4 py-2 text-sm">{new Date(o.sale_date).toLocaleString()}</td>
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
