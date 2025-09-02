// src/components/Product.jsx
import React, { useState, useEffect } from "react";
import { Trash2, Edit, Plus, Search, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import { useToast } from "./ui/use-toast";
import AlertDialog from "./ui/alert-dialog";

export default function Product() {
  // get current user & role
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role        = currentUser.role; // "MasterAdmin", "Admin", or "SuperAdmin"

  const API_ROOT     = import.meta.env.VITE_API_URL + "/api";
  const PRODUCTS_URL = `${API_ROOT}/products`;
  const DEALERS_URL  = `${API_ROOT}/master-admin/dealers`;
  const token        = localStorage.getItem("token") || "";

  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [products, setProducts] = useState([]);
  const [dealers,  setDealers]  = useState([]);
  const [filter,   setFilter]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteStrategy, setDeleteStrategy] = useState("soft"); // soft, hard, archive
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [showDeletedTab, setShowDeletedTab] = useState(false);

  const nigeriaStates = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue",
    "Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe",
    "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara",
    "Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau",
    "Rivers","Sokoto","Taraba","Yobe","Zamfara","FCT"
  ];

  const initialFormData = {
    state:         "",
    dealer_id:     "",
    device_type:   "Android",
    device_name:   "",
    device_model:  "",
    cost_price:    "",
    selling_price: "",
    add_quantity:  0,
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    fetchDealers();
    fetchProducts();
  }, []);

  useEffect(() => {
    // Detect duplicates whenever products change
    detectDuplicates();
  }, [products]);

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

  async function fetchDeletedProducts() {
    try {
      const res = await fetch(`${PRODUCTS_URL}/deleted`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeletedProducts(data.deletedProducts || []);
    } catch (e) {
      console.error("Could not load deleted products", e);
    }
  }

  async function restoreProduct(productId) {
    try {
      const res = await fetch(`${PRODUCTS_URL}/${productId}/restore`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      showSuccess(data.message);
      fetchProducts();
      fetchDeletedProducts();
    } catch (err) {
      showError(err.message || "Failed to restore product");
    }
  }

  function detectDuplicates() {
    const duplicates = [];
    const seen = new Map();
    
    products.forEach(product => {
      const key = `${product.device_name}-${product.device_model}-${product.dealer_id}`;
      if (seen.has(key)) {
        if (!duplicates.find(d => d.key === key)) {
          duplicates.push({
            key,
            products: [seen.get(key), product]
          });
        } else {
          duplicates.find(d => d.key === key).products.push(product);
        }
      } else {
        seen.set(key, product);
      }
    });
    
    setDuplicates(duplicates);
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
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showSuccess(data.message);
      setFormData(initialFormData);
      setEditing(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      showError(err.message || "Failed to save product");
    }
  }

  function startEdit(p) {
    setEditing(p);
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
    setShowForm(true);
  }

  function confirmDelete(product) {
    setProductToDelete(product);
    setShowDeleteModal(true);
  }

  async function handleDelete() {
    if (!productToDelete) return;

    try {
      const res = await fetch(`${PRODUCTS_URL}/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ strategy: deleteStrategy }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.message.includes("foreign key constraint")) {
          showWarning(`⚠️ ${data.message}\n\nSuggestion: Use 'Soft Delete' or 'Archive' instead of 'Hard Delete'.`);
        } else {
          showError(data.message);
        }
        return;
      }

      showSuccess(data.message);
      setShowDeleteModal(false);
      setProductToDelete(null);
      fetchProducts();
      fetchDeletedProducts();
    } catch (err) {
      if (err.message.includes("foreign key constraint")) {
        showWarning("⚠️ Cannot delete this product because it has associated orders. Consider archiving it instead.");
      } else {
        showError(err.message || "Delete failed");
      }
    }
  }

  // new: adjustQuantity inline
  async function adjustQty(productId, delta) {
    try {
      const res  = await fetch(`${PRODUCTS_URL}/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity_to_add: delta })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showSuccess(data.message);
      fetchProducts();
      // if editing same product, reset its add_quantity
      if (editing?.id === productId) {
        setFormData(fd => ({ ...fd, add_quantity: 0 }));
      }
    } catch (err) {
      showError(err.message || "Couldn't adjust stock");
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

      {/* Duplicates Alert */}
      {duplicates.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-yellow-800 font-medium">
                Found {duplicates.length} potential duplicate product(s)
              </span>
            </div>
            <button
              onClick={() => setShowDuplicates(!showDuplicates)}
              className="text-yellow-700 hover:text-yellow-900 text-sm font-medium"
            >
              {showDuplicates ? "Hide" : "View"} Details
            </button>
          </div>
          
          {showDuplicates && (
            <div className="mt-3 space-y-2">
              {duplicates.map((dup, index) => (
                <div key={index} className="bg-white rounded p-3 border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-2">
                    {dup.products[0].device_name} - {dup.products[0].device_model}
                  </p>
                  <div className="space-y-1">
                    {dup.products.map((p, pIndex) => (
                      <div key={pIndex} className="flex items-center justify-between text-xs">
                        <span>ID {p.id}: {p.dealer_name} - Qty: {p.quantity_available}</span>
                        <button
                          onClick={() => confirmDelete(p)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {role === "MasterAdmin" && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => { setShowForm(true); setEditing(null); }}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-lg px-4 py-2 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </button>
        </div>
      )}

      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by device or dealer…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full pl-10 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
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
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                <tr key={p.id} className={!p.is_available ? "opacity-50 bg-gray-50" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.dealer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.dealer_location}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {p.device_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.device_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.device_model}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₦{p.cost_price}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">₦{p.selling_price}</td>

                  {/* inline – / + control */}
                  <td className="px-6 py-4 text-sm">
                    {role === "MasterAdmin" ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => adjustQty(p.id, -1)}
                          disabled={p.quantity_available <= 0}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove one"
                        >–</button>
                        <span className="font-medium min-w-[2rem] text-center">{p.quantity_available}</span>
                        <button
                          onClick={() => adjustQty(p.id, +1)}
                          className="w-6 h-6 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200"
                          title="Add one"
                        >+</button>
                      </div>
                    ) : (
                      <span className="font-medium">{p.quantity_available}</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {p.is_low_stock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠️ Low
                      </span>
                    ) : ""}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {p.is_available ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <XCircle className="h-3 w-3 mr-1" />
                        Unavailable
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{profit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {role === "MasterAdmin" ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                          title="Edit Product"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => confirmDelete(p)}
                          className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          title="Delete Product"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900">Delete Product</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete <strong>{productToDelete?.device_name} - {productToDelete?.device_model}</strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deletion Strategy
              </label>
              <select
                value={deleteStrategy}
                onChange={(e) => setDeleteStrategy(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="soft">Soft Delete (Mark as deleted)</option>
                <option value="hard">Hard Delete (Permanent removal)</option>
                <option value="archive">Archive (Move to archive)</option>
              </select>
            </div>

            <div className="text-xs text-gray-500 mb-4 p-3 bg-gray-50 rounded">
              <Info className="h-4 w-4 inline mr-1" />
              {deleteStrategy === "soft" && "Product will be hidden but data preserved"}
              {deleteStrategy === "hard" && "Product and all related data will be permanently removed"}
              {deleteStrategy === "archive" && "Product will be moved to archive table"}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editing ? "Edit Product" : "Add New Product"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select State</option>
                    {nigeriaStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dealer</label>
                  <select
                    name="dealer_id"
                    value={formData.dealer_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select Dealer</option>
                    {dealers
                      .filter(d => !formData.state || d.location === formData.state)
                      .map(dealer => (
                        <option key={dealer.id} value={dealer.id}>
                          {dealer.business_name} - {dealer.location}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
                  <select
                    name="device_type"
                    value={formData.device_type}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="Android">Android</option>
                    <option value="iOS">iOS</option>
                    <option value="Feature Phone">Feature Phone</option>
                    <option value="Tablet">Tablet</option>
                    <option value="Accessory">Accessory</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Name</label>
                  <input
                    type="text"
                    name="device_name"
                    value={formData.device_name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., Samsung Galaxy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Device Model</label>
                  <input
                    type="text"
                    name="device_model"
                    value={formData.device_model}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="e.g., A05 64GB"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₦)</label>
                  <input
                    type="number"
                    name="cost_price"
                    value={formData.cost_price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₦)</label>
                  <input
                    type="number"
                    name="selling_price"
                    value={formData.selling_price}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity</label>
                  <input
                    type="number"
                    name="add_quantity"
                    value={formData.add_quantity}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setFormData(initialFormData);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#f59e0b] text-white rounded-md hover:bg-[#d97706]"
                >
                  {editing ? "Update Product" : "Add Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
