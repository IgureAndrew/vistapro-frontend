// src/components/Product.jsx
import React, { useState, useEffect } from "react";

export default function Product() {
  const API_ROOT      = import.meta.env.VITE_API_URL + "/api";
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
    cost_price: "",
    selling_price: "",
    imeis: [ "" ],
  });

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
      if (!res.ok) throw new Error(data.message);
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
      if (!res.ok) throw new Error(data.message);
      setProducts(data.products);
    } catch (e) {
      console.error(e);
      setError("Could not load products");
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "dealer_id") {
      const sel = dealers.find(d => d.id === +value);
      setFormData(fd => ({
        ...fd,
        dealer_id: +value,
        dealer_business_name: sel?.business_name || ""
      }));
    } else {
      setFormData(fd => ({ ...fd, [name]: value }));
    }
  }

  function addImeiField() {
    setFormData(fd => ({ ...fd, imeis: [...fd.imeis, ""] }));
  }
  function removeImeiField(idx) {
    setFormData(fd => ({
      ...fd,
      imeis: fd.imeis.filter((_, i) => i !== idx)
    }));
  }
  function handleImeiChange(idx, val) {
    setFormData(fd => {
      const imeis = [...fd.imeis];
      imeis[idx] = val;
      return { ...fd, imeis };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const method = editing ? "PUT" : "POST";
      const url    = editing
        ? `${PRODUCTS_URL}/${editing.id}`
        : PRODUCTS_URL;

      const payload = {
        dealer_id: formData.dealer_id,
        dealer_business_name: formData.dealer_business_name,
        device_type: formData.device_type,
        device_name: formData.device_name,
        device_model: formData.device_model,
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        ...(editing ? {} : { imeis: formData.imeis })
      };

      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setShowForm(false);
      setEditing(null);
      setFormData({
        dealer_id: "",
        dealer_business_name: "",
        device_type: "Android",
        device_name: "",
        device_model: "",
        cost_price: "",
        selling_price: "",
        imeis: [ "" ],
      });
      fetchProducts();
    } catch (e) {
      alert(e.message || "Operation failed");
    }
  }

  function handleEdit(p) {
    setEditing(p);
    setFormData({
      dealer_id: p.dealer_id,
      dealer_business_name: p.dealer_name,
      device_type: p.device_type,
      device_name: p.device_name,
      device_model: p.device_model,
      cost_price: String(p.cost_price),
      selling_price: String(p.selling_price),
      imeis: [ "" ],
    });
    setShowForm(true);
  }

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

  const displayed = products.filter(p => {
    const q = filter.toLowerCase();
    return (
      p.device_name.toLowerCase().includes(q) ||
      p.dealer_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Product Management</h1>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
        <input
          type="text"
          placeholder="Search by device or dealer…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full lg:w-1/3 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center space-x-3">
          <select className="border-gray-300 rounded-lg px-3 py-2 text-gray-700">
            <option>All Time</option>
            <option>Last 7 Days</option>
            <option>Last Month</option>
          </select>
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Add Product
          </button>
          <button
            onClick={() => {/* TODO: export logic */}}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Download Report
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID","Dealer","Type","Device","Model",
                "Cost","Sell","Qty Available",
                "Low Stock?","Available?","Profit","IMEIs","Actions"
              ].map(h => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayed.length > 0 ? displayed.map(p => {
              const profit = (parseFloat(p.selling_price) - parseFloat(p.cost_price) || 0).toFixed(2);
              return (
                <tr key={p.id} className={p.is_available ? "" : "opacity-50"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.dealer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.device_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.device_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.device_model}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.cost_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.selling_price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.quantity_available}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.is_low_stock ? "⚠️" : ""}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.is_available ? "✅" : "❌"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{profit}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(p.available_imeis ?? []).slice(0,3).join(", ")}
                    {p.available_imeis?.length > 3 && ` +${p.available_imeis.length - 3} more`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(p)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={13} className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="text-xl font-bold mb-4">
              {editing ? "Edit Product" : "Add Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dealer */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Dealer</label>
                <select
                  name="dealer_id"
                  value={formData.dealer_id}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select Dealer…</option>
                  {dealers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.business_name} ({d.unique_id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Device fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Type</label>
                  <select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="Android">Android</option>
                    <option value="iPhone">iPhone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Name</label>
                  <input
                    type="text"
                    name="device_name"
                    value={formData.device_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Device Model</label>
                  <input
                    type="text"
                    name="device_model"
                    value={formData.device_model}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              {/* IMEI inputs */}
              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">IMEIs (one per unit)</label>
                  {formData.imeis.map((val, idx) => (
                    <div key={idx} className="flex items-center space-x-2 mt-2">
                      <input
                        type="text"
                        placeholder="15-digit IMEI"
                        value={val}
                        pattern="\d{15}"
                        required
                        onChange={e => handleImeiChange(idx, e.target.value)}
                        className="flex-1 border-gray-300 rounded-lg px-3 py-2"
                      />
                      {formData.imeis.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImeiField(idx)}
                          className="px-2 py-1 bg-red-500 text-white rounded-lg"
                        >
                          –
                        </button>
                      )}
                      {idx === formData.imeis.length - 1 && (
                        <button
                          type="button"
                          onClick={addImeiField}
                          className="px-2 py-1 bg-green-500 text-white rounded-lg"
                        >
                          +
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg"
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
