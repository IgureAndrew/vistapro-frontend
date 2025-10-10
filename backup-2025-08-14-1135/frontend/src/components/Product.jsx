// src/components/Product.jsx
import React, { useState, useEffect } from "react";

export default function Product() {
  // get current user & role
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role        = currentUser.role; // "MasterAdmin", "Admin", or "SuperAdmin"

  const API_ROOT     = import.meta.env.VITE_API_URL + "/api";
  const PRODUCTS_URL = `${API_ROOT}/products`;
  const DEALERS_URL  = `${API_ROOT}/master-admin/dealers`;
  const token        = localStorage.getItem("token") || "";

  const [products, setProducts] = useState([]);
  const [dealers,  setDealers]  = useState([]);
  const [filter,   setFilter]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);

  const nigeriaStates = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
    "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe",
    "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
    "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau",
    "Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT"
  ];

  const [formData, setFormData] = useState({
    state:         "",
    dealer_id:     "",
    device_type:   "Android",
    device_name:   "",
    device_model:  "",
    cost_price:    "",
    selling_price: "",
    add_quantity:  0,
  });

  useEffect(() => {
    fetchDealers();
    fetchProducts();
  }, []);

  async function fetchDealers() {
    try {
      const res  = await fetch(DEALERS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDealers(data.dealers);
    } catch (e) {
      console.error("Could not load dealers", e);
    }
  }

  async function fetchProducts() {
    try {
      const res  = await fetch(PRODUCTS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setProducts(data.products);
    } catch (e) {
      console.error("Could not load products", e);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "state") {
      setFormData(fd => ({ ...fd, state: value, dealer_id: "" }));
    } else if (name === "dealer_id") {
      const sel = dealers.find(d => d.id === +value);
      setFormData(fd => ({
        ...fd,
        dealer_id: +value,
        state: sel?.location || fd.state
      }));
    } else {
      setFormData(fd => ({ ...fd, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const method = editing ? "PUT" : "POST";
    const url    = editing
      ? `${PRODUCTS_URL}/${editing.id}`
      : PRODUCTS_URL;

    const payload = {
      dealer_id:       formData.dealer_id,
      device_type:     formData.device_type,
      device_name:     formData.device_name,
      device_model:    formData.device_model,
      cost_price:      parseFloat(formData.cost_price),
      selling_price:   parseFloat(formData.selling_price),
      quantity_to_add: Number(formData.add_quantity),   // match API
    };

    try {
      const res  = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      alert(data.message);  // show success message

      setShowForm(false);
      setEditing(null);
      setFormData({
        state:         "",
        dealer_id:     "",
        device_type:   "Android",
        device_name:   "",
        device_model:  "",
        cost_price:    "",
        selling_price: "",
        add_quantity:  0,
      });
      fetchProducts();
    } catch (err) {
      alert(err.message || "Operation failed");
    }
  }

  function startEdit(p) {
    setEditing(p);
    setShowForm(true);
    setFormData({
      state:         p.dealer_location,
      dealer_id:     p.dealer_id,
      device_type:   p.device_type,
      device_name:   p.device_name,
      device_model:  p.device_model,
      cost_price:    String(p.cost_price),
      selling_price: String(p.selling_price),
      add_quantity:  0,
    });
  }

  async function handleDelete(id) {
    if (!window.confirm(
      "⚠️ This will permanently delete this product and its related stock.\nContinue?"
    )) return;

    try {
      const res  = await fetch(`${PRODUCTS_URL}/${id}`, {
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

  // new: adjustQuantity inline
  async function adjustQty(productId, delta) {
    try {
      const res  = await fetch(`${PRODUCTS_URL}/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`
        },
        body: JSON.stringify({ quantity_to_add: delta })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert(data.message);
      fetchProducts();
      // if editing same product, reset its add_quantity
      if (editing?.id === productId) {
        setFormData(fd => ({ ...fd, add_quantity: 0 }));
      }
    } catch (err) {
      alert(err.message || "Couldn’t adjust stock");
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

      {role === "MasterAdmin" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4 py-2"
          >
            Add Product
          </button>
        </div>
      )}

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by device or dealer…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID","Dealer","Location","Type","Device","Model",
                "Cost","Sell","Qty","Low","Avail","Profit","Actions"
              ].map(h => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayed.length ? displayed.map(p => {
              const profit = (p.selling_price - p.cost_price).toFixed(2);
              return (
                <tr key={p.id} className={!p.is_available ? "opacity-50" : ""}>
                  <td className="px-6 py-4 text-sm">{p.id}</td>
                  <td className="px-6 py-4 text-sm">{p.dealer_name}</td>
                  <td className="px-6 py-4 text-sm">{p.dealer_location}</td>
                  <td className="px-6 py-4 text-sm">{p.device_type}</td>
                  <td className="px-6 py-4 text-sm">{p.device_name}</td>
                  <td className="px-6 py-4 text-sm">{p.device_model}</td>
                  <td className="px-6 py-4 text-sm">{p.cost_price}</td>
                  <td className="px-6 py-4 text-sm">{p.selling_price}</td>

                  {/* inline – / + control */}
                  <td className="px-6 py-4 text-sm flex items-center space-x-2">
                    {role === "MasterAdmin" ? (
                      <>
                        <button
                          onClick={() => adjustQty(p.id, -1)}
                          disabled={p.quantity_available <= 0}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded"
                          title="Remove one"
                        >–</button>
                        <span>{p.quantity_available}</span>
                        <button
                          onClick={() => adjustQty(p.id, +1)}
                          className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded"
                          title="Add one"
                        >+</button>
                      </>
                    ) : (
                      <span>{p.quantity_available}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm">{p.is_low_stock ? "⚠️" : ""}</td>
                  <td className="px-6 py-4 text-sm">{p.is_available ? "✅" : "❌"}</td>
                  <td className="px-6 py-4 text-sm">{profit}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {role === "MasterAdmin" ? (
                      <>
                        <button
                          onClick={() => startEdit(p)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="text-red-600 hover:text-red-900"
                        >Delete</button>
                      </>
                    ) : (
                      <span className="text-gray-400 italic">—</span>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={13} className="px-6 py-4 text-center text-sm text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && role === "MasterAdmin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-full overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editing ? "Edit Product" : "Add Product"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* State */}
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

              {/* Dealer */}
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

              {/* Quantity to Add */}
              <div>
                <label className="block text-sm mb-1">Quantity to Add</label>
                <input
                  name="add_quantity"
                  type="number"
                  min="0"
                  value={formData.add_quantity}
                  onChange={handleChange}
                  className="w-full border px-2 py-1"
                />
              </div>

              {/* Sticky Footer */}
              <div className="sticky bottom-0 bg-white -mx-6 px-6 py-4 border-t flex justify-between">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
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
