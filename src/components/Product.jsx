// src/components/Product.jsx
import React, { useState, useEffect } from "react";

export default function Product() {
  const API_ROOT    = import.meta.env.VITE_API_URL + "/api";
  const PRODUCTS_URL = `${API_ROOT}/products`;
  const DEALERS_URL  = `${API_ROOT}/master-admin/dealers`;
  const token        = localStorage.getItem("token") || "";

  const [products, setProducts] = useState([]);
  const [dealers, setDealers]   = useState([]);
  const [filter, setFilter]     = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [error, setError]       = useState("");

  const [formData, setFormData] = useState({
    dealer_id: "",
    dealer_business_name: "",
    device_type: "Android",
    device_name: "",
    device_model: "",
    product_quantity: "",
    cost_price: "",
    selling_price: "",
  });

  // Fetch dealers & products once on mount
  useEffect(() => {
    fetchDealers();
    fetchProducts();
  }, []);

  async function fetchDealers() {
    try {
      const res  = await fetch(DEALERS_URL, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load dealers");
      setDealers(data.dealers);
    } catch (e) {
      console.error(e);
      setError("Could not load dealers");
    }
  }

  async function fetchProducts() {
    try {
      const res  = await fetch(PRODUCTS_URL, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load products");
      setProducts(data.products);
    } catch (e) {
      console.error(e);
      setError("Could not load products");
    }
  }

  // Handler for controlled inputs
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "dealer_id") {
      const sel = dealers.find(d => d.id === +value);
      setFormData(fd => ({
        ...fd,
        dealer_id: +value,
        dealer_business_name: sel.business_name
      }));
    } else {
      setFormData(fd => ({ ...fd, [name]: value }));
    }
  }
  

  // Submit add or edit
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url    = editing
        ? `${PRODUCTS_URL}/${editing.id}`
        : PRODUCTS_URL;

      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // refresh
      setShowForm(false);
      setEditing(null);
      setFormData({
        dealer_id: "",
        dealer_business_name: "",
        device_type: "Android",
        device_name: "",
        device_model: "",
        product_quantity: "",
        cost_price: "",
        selling_price: "",
      });
      fetchProducts();
    } catch (e) {
      alert(e.message || "Operation failed");
    }
  }

  // Populate form for editing
  function handleEdit(p) {
    setEditing(p);
    setFormData({
      dealer_id: p.dealer_id,
      dealer_business_name: p.dealer_business_name,
      device_type: p.device_type,
      device_name: p.device_name,
      device_model: p.device_model,
      product_quantity: String(p.product_quantity),
      cost_price: String(p.cost_price),
      selling_price: String(p.selling_price),
    });
    setShowForm(true);
  }

  // Delete product
  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchProducts();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  // Filtered products list
  const displayed = products.filter(p => {
    const q = filter.toLowerCase();
    return (
      p.device_name.toLowerCase().includes(q) ||
      p.dealer_business_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Management</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <input
        type="text"
        placeholder="Search by device or dealer…"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-full"
      />

      <button
        onClick={() => { setShowForm(true); setEditing(null); }}
        className="mb-4 px-4 py-2 bg-green-500 text-white rounded"
      >
        Add Product
      </button>

      <table className="min-w-full border mb-8">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Dealer</th>
            <th className="px-4 py-2 border">Type</th>
            <th className="px-4 py-2 border">Device</th>
            <th className="px-4 py-2 border">Model</th>
            <th className="px-4 py-2 border">Qty</th>
            <th className="px-4 py-2 border">Cost</th>
            <th className="px-4 py-2 border">Sell</th>
            <th className="px-4 py-2 border">Profit</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayed.length > 0 ? (
            displayed.map(p => {
              const profit = (
                parseFloat(p.selling_price) -
                parseFloat(p.cost_price) || 0
              ).toFixed(2);
              return (
                <tr key={p.id}>
                  <td className="px-4 py-2 border">{p.id}</td>
                  <td className="px-4 py-2 border">{p.dealer_business_name}</td>
                  <td className="px-4 py-2 border">{p.device_type}</td>
                  <td className="px-4 py-2 border">{p.device_name}</td>
                  <td className="px-4 py-2 border">{p.device_model}</td>
                  <td className="px-4 py-2 border">{p.product_quantity}</td>
                  <td className="px-4 py-2 border">{p.cost_price}</td>
                  <td className="px-4 py-2 border">{p.selling_price}</td>
                  <td className="px-4 py-2 border">{profit}</td>
                  <td className="px-4 py-2 border space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-2 py-1 bg-blue-500 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="px-2 py-1 bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10} className="text-center py-4">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editing ? "Edit Product" : "Add Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block font-semibold">Dealer:</label>
            <select
  name="dealer_id"
  value={formData.dealer_id}
  onChange={handleChange}
  required
>
  <option value="">Select Dealer…</option>
  {dealers.map(d => (
    <option key={d.id} value={d.id}>
      {d.business_name} ({d.unique_id})
    </option>
  ))}
</select>
              <label className="block font-semibold">Device Type</label>
              <select
                name="device_type"
                value={formData.device_type}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              >
                <option value="Android">Android</option>
                <option value="iPhone">iPhone</option>
              </select>

              <input
                type="text"
                name="device_name"
                placeholder="Device Name"
                value={formData.device_name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="text"
                name="device_model"
                placeholder="Device Model"
                value={formData.device_model}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="number"
                name="product_quantity"
                placeholder="Quantity"
                value={formData.product_quantity}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="number"
                step="0.01"
                name="cost_price"
                placeholder="Cost Price"
                value={formData.cost_price}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <input
                type="number"
                step="0.01"
                name="selling_price"
                placeholder="Selling Price"
                value={formData.selling_price}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2"
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  {editing ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
