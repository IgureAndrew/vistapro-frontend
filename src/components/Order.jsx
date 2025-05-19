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

  // stock-mode
  const [selectedPickupId, setSelectedPickupId] = useState("");

  // free-mode
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
    setForm({ number_of_devices: "", bnpl_platform: "", customer_name: "", customer_phone: "", customer_address: "" });

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
    const mode = placeData.mode;
    if (mode === "free") {
      if (!selectedDealer)                       errs.dealer = "Select a dealer";
      if (!selectedProductId)                    errs.product = "Select a product";
      if (!form.number_of_devices || Number(form.number_of_devices) < 1)
        errs.number_of_devices = "Enter a valid quantity";
    } else {
      if (!selectedPickupId)                     errs.pickup = "Select a pickup";
    }
    if (!form.bnpl_platform)                     errs.bnpl_platform    = "Select a BNPL platform";
    if (!form.customer_name.trim())              errs.customer_name    = "Customer name is required";
    if (!/^[0-9]{7,15}$/.test(form.customer_phone))
                                                errs.customer_phone   = "Enter a valid phone number";
    if (!form.customer_address.trim())           errs.customer_address = "Customer address is required";

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
      number_of_devices: placeData.mode === "free"
        ? Number(form.number_of_devices)
        : 1,
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
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
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
    <div className="px-4 py-6 mx-auto max-w-4xl space-y-8">
      {/* Place Order */}
      <section className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-2xl font-bold">Place Order</h2>
        {isStockMode && (
          <p className="text-yellow-800 bg-yellow-100 p-3 rounded">
            ⚠️ You have pending stock pickups—use your reserved stock.
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {isStockMode ? (
            <div className="col-span-2">
              <label className="block mb-1 font-medium">Select Pickup</label>
              <select
                value={selectedPickupId}
                onChange={e => setSelectedPickupId(e.target.value)}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${errors.pickup ? 'border-red-500' : ''}`}>
                <option value="">-- choose --</option>
                {placeData.pending.map(p => (
                  <option key={p.stock_update_id} value={p.stock_update_id}>
                    [{p.qty_reserved}] {p.device_name} {p.device_model} — {p.dealer_name} ({p.dealer_location})
                  </option>
                ))}
              </select>
              {errors.pickup && <p className="mt-1 text-red-600 text-sm">{errors.pickup}</p>}

              {selectedPickup && selectedPickup.imeis_reserved?.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded">
                  <p className="font-medium mb-2">Reserved IMEIs</p>
                  <ul className="list-disc list-inside text-sm">
                    {selectedPickup.imeis_reserved.map(imei => (
                      <li key={imei}>{imei}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>  
              <div>
                <label className="block mb-1 font-medium">Select Dealer</label>
                <select
                  value={selectedDealer}
                  onChange={handleDealerChange}
                  disabled={submitting}
                  className={`w-full border rounded px-3 py-2 ${errors.dealer ? 'border-red-500' : ''}`}>
                  <option value="">-- choose dealer --</option>
                  {dealers.map(d => (
                    <option key={d.unique_id} value={d.unique_id}>
                      {d.business_name} ({d.location})
                    </option>
                  ))}
                </select>
                {errors.dealer && <p className="mt-1 text-red-600 text-sm">{errors.dealer}</p>}
              </div>

              <div>
                <label className="block mb-1 font-medium">Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={e => setSelectedProductId(e.target.value)}
                  disabled={submitting || !selectedDealer}
                  className={`w-full border rounded px-3 py-2 ${errors.product ? 'border-red-500' : ''}`}>
                  <option value="">-- choose product --</option>
                  {dealerProducts.map(p => (
                    <option key={p.product_id} value={p.product_id}>
                      [{p.qty_available}] {p.device_name} {p.device_model}
                    </option>
                  ))}
                </select>
                {errors.product && <p className="mt-1 text-red-600 text-sm">{errors.product}</p>}
              </div>

              <div>
                <label className="block mb-1 font-medium">Quantity</label>
                <input
                  type="number"
                  name="number_of_devices"
                  min="1"
                  max={dealerProducts.find(p => p.product_id === +selectedProductId)?.qty_available || 1}
                  value={form.number_of_devices}
                  onChange={handleChange}
                  disabled={submitting || !selectedProductId}
                  className={`w-full border rounded px-3 py-2 ${errors.number_of_devices ? 'border-red-500' : ''}`} />
                {errors.number_of_devices && <p className="mt-1 text-red-600 text-sm">{errors.number_of_devices}</p>}
              </div>

              {selectedProductId && (
                <div className="md:col-span-2">
                  <label className="block mb-1 font-medium">Available IMEIs</label>
                  <textarea
                    readOnly
                    rows={4}
                    value={dealerProducts.find(p => p.product_id === +selectedProductId)
                      ?.imeis_available.slice(0, form.number_of_devices || 0).join('\n')}
                    className="w-full bg-gray-100 border rounded px-3 py-2 whitespace-pre-wrap text-sm"
                  />
                </div>
              )}
            </>
          )}

          {/* BNPL Platform */}
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block mb-1 font-medium">BNPL Platform</label>
            <select
              name="bnpl_platform"
              value={form.bnpl_platform}
              onChange={handleChange}
              disabled={submitting}
              className={`w-full border rounded px-3 py-2 ${errors.bnpl_platform ? 'border-red-500' : ''}`}>
              <option value="">None</option>
              <option value="WATU">WATU</option>
              <option value="EASYBUY">EASYBUY</option>
              <option value="CREDIT DIRECT">CREDIT DIRECT</option>
            </select>
            {errors.bnpl_platform && <p className="mt-1 text-red-600 text-sm">{errors.bnpl_platform}</p>}
          </div>

          {/* Customer Info */}
          <div className="md:col-span-2 lg:col-span-1 grid grid-cols-1 gap-4">
            <div>
              <label className="block mb-1 font-medium">Customer Name</label>
              <input
                name="customer_name"
                value={form.customer_name}
                onChange={handleChange}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${errors.customer_name ? 'border-red-500' : ''}`} />
              {errors.customer_name && <p className="mt-1 text-red-600 text-sm">{errors.customer_name}</p>}
            </div>
            <div>
              <label className="block mb-1 font-medium">Customer Phone</label>
              <input
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                disabled={submitting}
                className={`w-full border rounded px-3 py-2 ${errors.customer_phone ? 'border-red-500' : ''}`} />
              {errors.customer_phone && <p className="mt-1 text-red-600 text-sm">{errors.customer_phone}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Customer Address</label>
              <textarea
                name="customer_address"
                value={form.customer_address}
                onChange={handleChange}
                disabled={submitting}
                rows={2}
                className={`w-full border rounded px-3 py-2 ${errors.customer_address ? 'border-red-500' : ''}`} />
              {errors.customer_address && <p className="mt-1 text-red-600 text-sm">{errors.customer_address}</p>}
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3 text-white rounded font-semibold transition-colors ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              {submitting ? 'Placing...' : 'Place Order'}
            </button>
          </div>
        </form>
      </section>

      {/* Your Orders */}
      <section className="bg-white p-6 rounded-lg shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length ? (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-1 text-left font-semibold">#</th>
                <th className="px-2 py-1 text-left font-semibold">Device</th>
                <th className="hidden sm:table-cell px-2 py-1 text-left font-semibold">Model</th>
                <th className="px-2 py-1 text-left font-semibold">Qty</th>
                <th className="px-2 py-1 text-right font-semibold">Amount</th>
                <th className="hidden md:table-cell px-2 py-1 text-left font-semibold">Date</th>
                <th className="px-2 py-1 text-left font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1">{o.id}</td>
                  <td className="px-2 py-1">{o.device_name}</td>
                  <td className="hidden sm:table-cell px-2 py-1">{o.device_model}</td>
                  <td className="px-2 py-1">{o.number_of_devices}</td>
                  <td className="px-2 py-1 text-right">₦{Number(o.sold_amount).toLocaleString()}</td>
                  <td className="hidden md:table-cell px-2 py-1">{new Date(o.sale_date).toLocaleDateString()}</td>
                  <td className="px-2 py-1 capitalize">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500">No orders found.</p>
        )}
      </section>
    </div>
  );
}
