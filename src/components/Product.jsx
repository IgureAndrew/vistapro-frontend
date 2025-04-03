import React, { useState, useEffect } from "react";

function Product() {
  // Use the full URL for the products endpoint
  const baseUrl = "https://vistapro-backend.onrender.com/api/products";
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;
  const isMasterAdmin = user && user.role === "MasterAdmin";

  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    dealer_id: "",
    dealer_business_name: "",
    device_name: "",
    device_model: "",
    product_quantity: "",
    overall_product_quantity: "",
    product_base_price: "",
    cost_price: "",
  });

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products whenever filter or products changes
  useEffect(() => {
    if (filter.trim() === "") {
      setFilteredProducts(products);
    } else {
      const lowerFilter = filter.toLowerCase();
      setFilteredProducts(
        products.filter(
          (prod) =>
            prod.device_name.toLowerCase().includes(lowerFilter) ||
            (prod.dealer_business_name &&
              prod.dealer_business_name.toLowerCase().includes(lowerFilter))
        )
      );
    }
  }, [filter, products]);

  const fetchProducts = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      const res = await fetch(baseUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
      } else {
        setError(data.message || "Failed to fetch products");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching products");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const currentToken = localStorage.getItem("token");
    if (!currentToken) {
      alert("No token provided. Please log in again.");
      return;
    }
    try {
      const method = editingProduct ? "PUT" : "POST";
      // Use the correct endpoint path for products
      const url = editingProduct ? `${baseUrl}/${editingProduct.id}` : baseUrl;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setShowForm(false);
        setEditingProduct(null);
        // Reset form data after submission
        setFormData({
          dealer_id: "",
          dealer_business_name: "",
          device_name: "",
          device_model: "",
          product_quantity: "",
          overall_product_quantity: "",
          product_base_price: "",
          cost_price: "",
        });
        fetchProducts();
      } else {
        alert(data.message || "Operation failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting form");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const currentToken = localStorage.getItem("token");
    try {
      const res = await fetch(`${baseUrl}/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchProducts();
      } else {
        alert(data.message || "Failed to delete product");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      dealer_id: product.dealer_id,
      dealer_business_name: product.dealer_business_name,
      device_name: product.device_name,
      device_model: product.device_model,
      product_quantity: product.product_quantity,
      overall_product_quantity: product.overall_product_quantity,
      product_base_price: product.product_base_price,
      cost_price: product.cost_price,
    });
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      dealer_id: "",
      dealer_business_name: "",
      device_name: "",
      device_model: "",
      product_quantity: "",
      overall_product_quantity: "",
      product_base_price: "",
      cost_price: "",
    });
    setShowForm(true);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Product Management</h2>

      {/* Filter Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by device name or dealer..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 rounded px-3 py-2 w-full"
        />
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Only show Add button for Master Admin */}
      {isMasterAdmin && (
        <button 
          onClick={handleAdd}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Product
        </button>
      )}

      {/* Products Table */}
      <table className="min-w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="px-4 py-2 border">ID</th>
            <th className="px-4 py-2 border">Dealer</th>
            <th className="px-4 py-2 border">Device</th>
            <th className="px-4 py-2 border">Model</th>
            <th className="px-4 py-2 border">Quantity</th>
            <th className="px-4 py-2 border">Overall Qty</th>
            <th className="px-4 py-2 border">Base Price</th>
            <th className="px-4 py-2 border">Cost Price</th>
            {isMasterAdmin && <th className="px-4 py-2 border">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((prod) => (
              <tr key={prod.id}>
                <td className="border px-4 py-2">{prod.id}</td>
                <td className="border px-4 py-2">{prod.dealer_business_name}</td>
                <td className="border px-4 py-2">{prod.device_name}</td>
                <td className="border px-4 py-2">{prod.device_model}</td>
                <td className="border px-4 py-2">{prod.product_quantity}</td>
                <td className="border px-4 py-2">{prod.overall_product_quantity}</td>
                <td className="border px-4 py-2">{prod.product_base_price}</td>
                <td className="border px-4 py-2">{prod.cost_price}</td>
                {isMasterAdmin && (
                  <td className="border px-4 py-2">
                    <button 
                      onClick={() => handleEdit(prod)}
                      className="px-2 py-1 text-sm bg-blue-500 text-white rounded mr-2"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(prod.id)}
                      className="px-2 py-1 text-sm bg-red-500 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isMasterAdmin ? "9" : "8"} className="text-center p-4">
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal Form for Adding/Editing Products */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {editingProduct ? "Edit Product" : "Add Product"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="number"
                name="dealer_id"
                placeholder="Dealer ID"
                value={formData.dealer_id}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                name="dealer_business_name"
                placeholder="Dealer Business Name"
                value={formData.dealer_business_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="text"
                name="device_name"
                placeholder="Device Name"
                value={formData.device_name}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                name="device_model"
                placeholder="Device Model"
                value={formData.device_model}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                name="product_quantity"
                placeholder="Product Quantity"
                value={formData.product_quantity}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                name="overall_product_quantity"
                placeholder="Overall Product Quantity"
                value={formData.overall_product_quantity}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.01"
                name="product_base_price"
                placeholder="Product Base Price"
                value={formData.product_base_price}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.01"
                name="cost_price"
                placeholder="Cost Price"
                value={formData.cost_price}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-gray-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded font-bold hover:bg-blue-600 transition"
                >
                  {editingProduct ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Product;
