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
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    bnpl_platform: "",
  });

  useEffect(() => {
    fetchPlaceData();
    fetchOrders();
  }, []);

  async function fetchPlaceData() {
    try {
      const res = await fetch(PLACE_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      const data = await res.json();
      setPlaceData(data);
      setSelectedId("");
      setFormState({
        number_of_devices: "",
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        bnpl_platform: "",
      });
    } catch (err) {
      console.error("fetchPlaceData:", err);
      alert(err.message || "Could not load order form");
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      const data = await res.json();
      setOrders(data.orders);
    } catch (err) {
      console.error("fetchOrders:", err);
      alert(err.message || "Could not load your orders");
    }
  }

  const handleSelectChange = e => {
    setSelectedId(e.target.value);
    // reset quantity when changing selection:
    setFormState(fs => ({ ...fs, number_of_devices: "" }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormState(fs => ({ ...fs, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedId) return alert("Please select an item first.");

    const record = placeData.mode === "stock"
      ? placeData.pending.find(p => p.stock_update_id === +selectedId)
      : placeData.products.find(p => p.product_id === +selectedId);

    const qty   = parseInt(formState.number_of_devices, 10);
    const price = Number(record.selling_price);

    if (!qty || qty < 1) {
      return alert("Enter a valid quantity");
    }
    if (!formState.customer_name ||
        !formState.customer_phone ||
        !formState.customer_address) {
      return alert("Fill in all customer details");
    }

    const sold_amount = price * qty;

    const body = placeData.mode === "stock"
      ? {
          stock_update_id:   record.stock_update_id,
          number_of_devices: qty,
          sold_amount,
          customer_name:     formState.customer_name,
          customer_phone:    formState.customer_phone,
          customer_address:  formState.customer_address,
          bnpl_platform:     formState.bnpl_platform || null,
        }
      : {
          product_id:        record.product_id,
          number_of_devices: qty,
          sold_amount,
          customer_name:     formState.customer_name,
          customer_phone:    formState.customer_phone,
          customer_address:  formState.customer_address,
          bnpl_platform:     formState.bnpl_platform || null,
        };

    try {
      const res = await fetch(PLACE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || `Error ${res.status}`);
      }
      alert("Order placed successfully!");
      fetchPlaceData();
      fetchOrders();
    } catch (err) {
      console.error("handleSubmit:", err);
      alert(err.message || "Failed to place order");
    }
  }

  if (!placeData) {
    return <div className="p-4">Loading form…</div>;
  }

  // determine the selected record (stock vs free)
  const selected = selectedId
    ? (placeData.mode === "stock"
        ? placeData.pending.find(p => p.stock_update_id === +selectedId)
        : placeData.products.find(p => p.product_id === +selectedId))
    : null;

  // build the full IMEI array from whichever prop your API sends
  const allImeis = selected
    ? (placeData.mode === "stock"
        ? selected.imeis_reserved || []
        : selected.imeis_available || [])
    : [];

  // parse the requested quantity
  const qty = parseInt(formState.number_of_devices, 10) || 0;

  // slice down to first N IMEIs
  const displayedImeis = allImeis.slice(0, qty);

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      {/* ───────── Place Order ───────── */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Place Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select dropdown */}
          <div>
            <label className="block font-semibold mb-1">
              Select {placeData.mode === "stock" ? "Pickup" : "Product"}
            </label>
            <select
              value={selectedId}
              onChange={handleSelectChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">-- choose --</option>
              {placeData.mode === "stock"
                ? placeData.pending.map(p => (
                    <option
                      key={p.stock_update_id}
                      value={p.stock_update_id}
                    >
                      [{p.qty_reserved}] {p.device_name} {p.device_model}
                    </option>
                  ))
                : placeData.products.map(p => (
                    <option
                      key={p.product_id}
                      value={p.product_id}
                    >
                      [{p.qty_available} available] {p.device_name} {p.device_model}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* Auto‐Filled Read‐Only Fields */}
          {selected && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["device_name","device_model","device_type","selling_price"]
                  .map((field,i) => (
                    <div key={i}>
                      <label className="block font-semibold mb-1">
                        {field.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                      </label>
                      <input
                        readOnly
                        value={selected[field]}
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                      />
                    </div>
                ))}
              </div>

              {/* ─── IMEIs (first N) ─── */}
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

              {/* Quantity & BNPL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    name="number_of_devices"
                    min="1"
                    max={ placeData.mode==="stock"
                      ? selected.qty_reserved
                      : selected.qty_available }
                    value={formState.number_of_devices}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">BNPL Platform</label>
                  <select
                    name="bnpl_platform"
                    value={formState.bnpl_platform}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">None</option>
                    <option value="WATU">WATU</option>
                    <option value="EASYBUY">EASYBUY</option>
                    <option value="CREDIT DIRECT">CREDIT DIRECT</option>
                  </select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Customer Name</label>
                  <input
                    name="customer_name"
                    value={formState.customer_name}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Customer Phone</label>
                  <input
                    name="customer_phone"
                    value={formState.customer_phone}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Customer Address</label>
                  <input
                    name="customer_address"
                    value={formState.customer_address}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-black text-[#FFD700] font-bold px-6 py-2 rounded"
              >
                Place Order
              </button>
            </>
          )}
        </form>
      </div>

      {/* ───────── Order History ───────── */}
      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <h3 className="text-xl font-bold mb-4">Your Orders</h3>
        {orders.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["#","Device","Model","Qty","Amount","Date","Status"]
                  .map((h,i) => (
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
          <p className="text-center text-gray-500 font-medium">
            No orders found.
          </p>
        )}
      </div>
    </div>
  );
}
