// src/components/Product.jsx
import React, { useState, useEffect } from "react";

export default function Product() {
  const API_ROOT      = import.meta.env.VITE_API_URL + "/api";
  const PRODUCTS_URL = `${API_ROOT}/products`;
  const DEALERS_URL  = `${API_ROOT}/master-admin/dealers`;
  const token        = localStorage.getItem("token") || "";

  const [products, setProducts] = useState([]);
  const [dealers,  setDealers]  = useState([]);
  const [filter,   setFilter]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  // Static list of Nigerian states
  const nigeriaStates = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
    "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe",
    "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
    "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau",
    "Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT"
  ];

  // Form state
  const [formData, setFormData] = useState({
    state: "",
    dealer_id: "",
    dealer_business_name: "",
    device_type: "Android",
    device_name: "",
    device_model: "",
    cost_price: "",
    selling_price: "",
    imeis: [""],
  });

  useEffect(() => {
    fetchDealers();
    fetchProducts();
  }, []);

  async function fetchDealers() {
    try {
      const res  = await fetch(DEALERS_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDealers(data.dealers);
    } catch (e) {
      console.error("Could not load dealers", e);
    }
  }

  async function fetchProducts() {
    try {
      const res  = await fetch(PRODUCTS_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data.products);
    } catch (e) {
      console.error("Could not load products", e);
    }
  }

  // Handle form field changes
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "state") {
      // When state changes, clear dealer selection
      setFormData(fd => ({
        ...fd,
        state: value,
        dealer_id: "",
        dealer_business_name: ""
      }));
    }
    else if (name === "dealer_id") {
      // When dealer changes, auto-flush business name
      const sel = dealers.find(d => d.id === +value);
      setFormData(fd => ({
        ...fd,
        dealer_id: +value,
        dealer_business_name: sel?.business_name || "",
        state: sel?.location || fd.state
      }));
    }
    else {
      setFormData(fd => ({ ...fd, [name]: value }));
    }
  }

  // IMEI helpers
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

  // Submit new or updated product
  async function handleSubmit(e) {
    e.preventDefault();
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

    try {
      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Reset form & refresh list
      setShowForm(false);
      setEditing(null);
      setFormData({
        state: "",
        dealer_id: "",
        dealer_business_name: "",
        device_type: "Android",
        device_name: "",
        device_model: "",
        cost_price: "",
        selling_price: "",
        imeis: [""],
      });
      fetchProducts();
    } catch (err) {
      alert(err.message || "Operation failed");
    }
  }

  // Begin editing
  function handleEdit(p) {
    setEditing(p);
    setFormData({
      state: p.dealer_location,
      dealer_id: p.dealer_id,
      dealer_business_name: p.dealer_name,
      device_type: p.device_type,
      device_name: p.device_name,
      device_model: p.device_model,
      cost_price: String(p.cost_price),
      selling_price: String(p.selling_price),
      imeis: [""],
    });
    setShowForm(true);
  }

  // Delete product
  async function handleDelete(id) {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${PRODUCTS_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchProducts();
    } catch (err) {
      alert(err.message || "Delete failed");
    }
  }

  // Filter for search bar
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

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 space-y-4 lg:space-y-0">
        <input
          type="text"
          placeholder="Search by device or dealer…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full lg:w-1/3 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID","Dealer","Location","Type","Device","Model",
                "Cost","Sell","Qty Available","Low Stock?","Available?",
                "Profit","IMEIs","Actions"
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
            {displayed.length ? displayed.map(p => {
              const profit = (parseFloat(p.selling_price) - parseFloat(p.cost_price) || 0).toFixed(2);
              return (
                <tr key={p.id} className={!p.is_available ? "opacity-50" : ""}>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.dealer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.dealer_location}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.device_type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.device_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.device_model}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.cost_price}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.selling_price}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.quantity_available}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.is_low_stock ? "⚠️" : ""}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.is_available ? "✅" : "❌"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{profit}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {(p.available_imeis ?? []).slice(0,3).join(", ")}
                    {p.available_imeis?.length > 3 ? ` +${p.available_imeis.length-3} more` : ""}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(p)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={14} className="px-6 py-4 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <h2 className="text-xl mb-4">{editing ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* State Selector */}
              <div>
                <label className="block text-sm mb-1">State</label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full border px-2 py-1"
                >
                  <option value="">— Select State —</option>
                  {nigeriaStates.map(st => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Dealer filtered by state */}
              <div>
                <label className="block text-sm mb-1">Dealer</label>
                <select
                  name="dealer_id"
                  value={formData.dealer_id}
                  onChange={handleChange}
                  className="w-full border px-2 py-1"
                >
                  <option value="">— Select Dealer —</option>
                  {dealers
                    .filter(d => !formData.state || d.location === formData.state)
                    .map(d => (
                      <option key={d.id} value={d.id}>{d.business_name}</option>
                    ))}
                </select>
              </div>

              {/* Device Type */}
              <div>
                <label className="block text-sm mb-1">Device Type</label>
                <select
                  name="device_type"
                  value={formData.device_type}
                  onChange={handleChange}
                  className="w-full border px-2 py-1"
                >
                  <option>Android</option>
                  <option>iOS</option>
                </select>
              </div>

              {/* Name & Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    name="device_name"
                    value={formData.device_name}
                    onChange={handleChange}
                    className="w-full border px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Model</label>
                  <input
                    name="device_model"
                    value={formData.device_model}
                    onChange={handleChange}
                    className="w-full border px-2 py-1"
                  />
                </div>
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Cost Price</label>
                  <input
                    name="cost_price"
                    type="number"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full border px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Selling Price</label>
                  <input
                    name="selling_price"
                    type="number"
                    value={formData.selling_price}
                    onChange={handleChange}
                    className="w-full border px-2 py-1"
                  />
                </div>
              </div>

              {/* IMEIs (only on create) */}
              {!editing && formData.imeis.map((imei,i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    placeholder="15-digit IMEI"
                    value={imei}
                    onChange={e => handleImeiChange(i,e.target.value)}
                    className="flex-1 border px-2 py-1"
                  />
                  <button type="button" onClick={() => removeImeiField(i)} className="text-red-600">✕</button>
                </div>
              ))}
              {!editing && (
                <button type="button" onClick={addImeiField} className="text-sm text-indigo-600">+ Add another IMEI</button>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded">
                  {editing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
