// src/components/Order.jsx
import React, { useState, useEffect } from "react";

export default function Order() {
  const API_ROOT          = import.meta.env.VITE_API_URL + "/api/marketer";
  const DEALERS_URL       = `${API_ROOT}/dealers`;
  const dealerProductsUrl = (uid) => `${API_ROOT}/dealers/${uid}/products`;
  const PLACE_URL         = `${API_ROOT}/orders`;
  const HISTORY_URL       = `${API_ROOT}/orders/history`;
  const token             = localStorage.getItem("token") || "";

  // Lists & selections
  const [dealers, setDealers]                     = useState([]);
  const [dealerProducts, setDealerProducts]       = useState([]);
  const [selectedDealer, setSelectedDealer]       = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct]     = useState(null);

  // Form state & history
  const [formState, setFormState] = useState({
    number_of_devices: "",
    bnpl_platform:     "",
    customer_name:     "",
    customer_phone:    "",
    customer_address:  "",
  });
  const [errors, setErrors] = useState({});
  const [orders, setOrders] = useState([]);

  // Load dealers + order history on mount
  useEffect(() => {
    fetchDealers();
    fetchOrders();
  }, []);

  async function fetchDealers() {
    try {
      const res = await fetch(DEALERS_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const { dealers } = await res.json();
      setDealers(dealers);
    } catch (err) {
      console.error("Could not load dealers:", err);
      alert("Failed to load dealers");
    }
  }

  async function fetchOrders() {
    try {
      const res = await fetch(HISTORY_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const { orders } = await res.json();
      setOrders(orders);
    } catch (err) {
      console.error("Could not load orders:", err);
      alert("Failed to load your orders");
    }
  }

  // Dealer → products
  async function onDealerChange(e) {
    const uid = e.target.value;
    setSelectedDealer(uid);
    setSelectedProductId("");
    setSelectedProduct(null);
    setDealerProducts([]);

    if (!uid) return;
    try {
      const res = await fetch(dealerProductsUrl(uid), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const { products } = await res.json();
      setDealerProducts(products);
    } catch (err) {
      console.error("Could not load dealer products:", err);
      alert("Failed to load products for that dealer");
    }
  }

  // Product → details
  function onProductChange(e) {
    const id = +e.target.value;
    setSelectedProductId(id);
    const p = dealerProducts.find(x => x.product_id === id);
    setSelectedProduct(p || null);

    // reset quantity & errors
    setFormState(fs => ({ ...fs, number_of_devices: "" }));
    setErrors({});
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormState(fs => ({ ...fs, [name]: value }));
  }

  function validate() {
    const errs = {};
    const {
      number_of_devices,
      bnpl_platform,
      customer_name,
      customer_phone,
      customer_address
    } = formState;

    if (selectedProduct && qty > selectedProduct.qty_available) {
           errs.number_of_devices = `Only ${selectedProduct.qty_available} in stock`;
         }

    if (!number_of_devices || Number(number_of_devices) < 1) {
      errs.number_of_devices = "Enter a valid quantity";
    }
    if (!bnpl_platform) {
      errs.bnpl_platform = "Select a BNPL platform";
    }
    if (!customer_name.trim()) {
      errs.customer_name = "Customer name is required";
    }
    if (!/^[0-9]{7,15}$/.test(customer_phone)) {
      errs.customer_phone = "Enter a valid phone number";
    }
    if (!customer_address.trim()) {
      errs.customer_address = "Customer address is required";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedDealer)                return alert("Please select a dealer first.");
    if (!selectedProductId)             return alert("Please select a product first.");
    if (!validate())                    return;

    const qty = parseInt(formState.number_of_devices, 10);
    const sold_amount = Number(selectedProduct.selling_price) * qty;

    const body = {
      product_id:        selectedProduct.product_id,
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
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Order placed successfully!");
      // reset & reload history
      setSelectedProductId("");
      setSelectedProduct(null);
      setFormState({
        number_of_devices: "",
        bnpl_platform:     "",
        customer_name:     "",
        customer_phone:    "",
        customer_address:  "",
      });
      fetchOrders();
    } catch (err) {
      console.error("Failed to place order:", err);
      alert(err.message || "Order failed");
    }
  }

  const qty = parseInt(formState.number_of_devices, 10) || 0;
  const displayImeis = selectedProduct
    ? selectedProduct.imeis_available.slice(0, qty)
    : [];

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-8">
      {/* Place Order */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Place Order</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Dealer */}
          <div>
            <label className="block font-semibold mb-1">Dealer</label>
            <select
              value={selectedDealer}
              onChange={onDealerChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">— Select Dealer —</option>
              {dealers.map(d => (
                <option key={d.unique_id} value={d.unique_id}>
                  {d.business_name}
                </option>
              ))}
            </select>
          </div>

          {/* Product */}
          {selectedDealer && (
            <div>
              <label className="block font-semibold mb-1">Product</label>
              <select
                value={selectedProductId}
                onChange={onProductChange}
                className="w-full border rounded px-3 py-2"
                required
              >
                <option value="">— Select Product —</option>
                {dealerProducts.map(p => (
                  <option key={p.product_id} value={p.product_id}>
                    [{p.qty_available} available] {p.device_name} {p.device_model}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Details */}
          {selectedProduct && (
            <>
              {/* Dealer & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Dealer</label>
                  <input
                    readOnly
                    value={
                      dealers.find(d => d.unique_id === selectedDealer)?.business_name || ""
                    }
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Location</label>
                  <input
                    readOnly
                    value={
                      dealers.find(d => d.unique_id === selectedDealer)?.location || ""
                    }
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                  />
                </div>
              </div>

              {/* Device info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["device_name","device_model","device_type","selling_price"].map((f,i)=>(
                  <div key={i}>
                    <label className="block font-semibold mb-1">
                      {f.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase())}
                    </label>
                    <input
                      readOnly
                      value={selectedProduct[f]}
                      className="w-full border rounded px-3 py-2 bg-gray-100"
                    />
                  </div>
                ))}
              </div>

              {/* IMEIs (sliced to quantity) */}
              <div>
                <label className="block font-semibold mb-1">
                  IMEI{qty>1?'s':''} (showing {qty})
                </label>
                <textarea
                  readOnly
                  rows={Math.min(5, displayImeis.length)}
                  value={displayImeis.join("\n")}
                  className="w-full border rounded px-3 py-2 bg-gray-100"
                />
              </div>

              {/* Order fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label className="block font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    name="number_of_devices"
                    min="1"
                    max={selectedProduct.qty_available}
                    value={formState.number_of_devices}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.number_of_devices ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.number_of_devices && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors.number_of_devices}
                    </p>
                  )}
                </div>

                {/* BNPL */}
                <div>
                  <label className="block font-semibold mb-1">BNPL Platform</label>
                  <select
                    name="bnpl_platform"
                    value={formState.bnpl_platform}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.bnpl_platform ? "border-red-500" : ""
                    }`}
                    required
                  >
                    <option value="">None</option>
                    <option value="WATU">WATU</option>
                    <option value="EASYBUY">EASYBUY</option>
                    <option value="CREDIT DIRECT">CREDIT DIRECT</option>
                  </select>
                  {errors.bnpl_platform && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors.bnpl_platform}
                    </p>
                  )}
                </div>
              </div>

              {/* Customer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Customer Name</label>
                  <input
                    name="customer_name"
                    value={formState.customer_name}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.customer_name ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.customer_name && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors.customer_name}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block font-semibold mb-1">Customer Phone</label>
                  <input
                    name="customer_phone"
                    value={formState.customer_phone}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.customer_phone ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.customer_phone && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors.customer_phone}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block font-semibold mb-1">Customer Address</label>
                  <input
                    name="customer_address"
                    value={formState.customer_address}
                    onChange={handleChange}
                    className={`w-full border rounded px-3 py-2 ${
                      errors.customer_address ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.customer_address && (
                    <p className="mt-1 text-red-600 text-sm">
                      {errors.customer_address}
                    </p>
                  )}
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

      {/* Order history */}
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
