// src/components/Product.jsx
import React, { useState, useEffect } from "react";
import { Trash2, Edit, Plus, Search, AlertTriangle, CheckCircle, XCircle, Info, Clock, User, Activity } from "lucide-react";
import { useToast } from "./ui/use-toast";
import AlertDialog from "./ui/alert-dialog";

// Import mobile-first components
import MobileTable from "./MobileTable";
import MobileCard from "./MobileCard";
import MobileSearch from "./MobileSearch";

// Import mobile design system
// import "../styles/mobile-design-system.css"; // Removed - file doesn't exist

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
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleteStrategy, setDeleteStrategy] = useState("soft"); // soft, hard, archive
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [showDeletedTab, setShowDeletedTab] = useState(false);
  const [productActivities, setProductActivities] = useState([]);
  const [showActivityHistory, setShowActivityHistory] = useState(false);
  const [masterAdminName, setMasterAdminName] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    deviceType: 'all',
    location: 'all',
    dealer: 'all',
    availability: 'all',
    stockLevel: 'all',
    costPriceMin: '',
    costPriceMax: '',
    sellingPriceMin: '',
    sellingPriceMax: '',
    quantityMin: '',
    quantityMax: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
    console.log("🔍 Product component useEffect triggered");
    console.log("Current user:", currentUser);
    console.log("User role:", role);
    console.log("MasterAdmin name:", `${currentUser.first_name} ${currentUser.last_name}`);
    
    fetchDealers();
    fetchProducts();
    setMasterAdminName(`${currentUser.first_name} ${currentUser.last_name}`);
    
    if (role === 'MasterAdmin') {
      console.log("✅ User is MasterAdmin, fetching product activities");
      fetchProductActivities();
    } else {
      console.log("❌ User is not MasterAdmin, skipping product activities fetch");
    }
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

  async function fetchProductActivities() {
    try {
      console.log("🔍 Fetching product activities...");
      console.log("API URL:", `${PRODUCTS_URL}/recent-activities?limit=20`);
      console.log("Token:", token ? "Present" : "Missing");
      
      const res = await fetch(`${PRODUCTS_URL}/recent-activities?limit=20`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      
      if (!res.ok) throw new Error(data.message);
      setProductActivities(data.activities || []);
      console.log("✅ Product activities loaded:", data.activities?.length || 0, "activities");
    } catch (e) {
      console.error("❌ Could not load product activities", e);
    }
  }

  function formatTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  function getActivityIcon(actionType) {
    switch (actionType) {
      case 'created': return <Plus className="h-4 w-4 text-green-600" />;
      case 'updated': return <Edit className="h-4 w-4 text-blue-600" />;
      case 'deleted': return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'quantity_added': return <Plus className="h-4 w-4 text-green-600" />;
      case 'quantity_removed': return <XCircle className="h-4 w-4 text-orange-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  }

  function getActivityColor(actionType) {
    switch (actionType) {
      case 'created': return 'bg-green-100 text-green-800';
      case 'updated': return 'bg-blue-100 text-blue-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      case 'quantity_added': return 'bg-green-100 text-green-800';
      case 'quantity_removed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
      if (role === 'MasterAdmin') {
        fetchProductActivities();
      }
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

  // Filter helper functions
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      deviceType: 'all',
      location: 'all',
      dealer: 'all',
      availability: 'all',
      stockLevel: 'all',
      costPriceMin: '',
      costPriceMax: '',
      sellingPriceMin: '',
      sellingPriceMax: '',
      quantityMin: '',
      quantityMax: ''
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.deviceType !== 'all') count++;
    if (filters.location !== 'all') count++;
    if (filters.dealer !== 'all') count++;
    if (filters.availability !== 'all') count++;
    if (filters.stockLevel !== 'all') count++;
    if (filters.costPriceMin || filters.costPriceMax) count++;
    if (filters.sellingPriceMin || filters.sellingPriceMax) count++;
    if (filters.quantityMin || filters.quantityMax) count++;
    return count;
  };

  // Get unique values for dropdowns
  const getUniqueLocations = () => {
    const locations = [...new Set(products.map(p => p.dealer_location))].filter(Boolean);
    return locations.sort();
  };

  const getUniqueDealers = () => {
    const dealerNames = [...new Set(products.map(p => p.dealer_name))].filter(Boolean);
    return dealerNames.sort();
  };

  const getUniqueDeviceTypes = () => {
    const types = [...new Set(products.map(p => p.device_type))].filter(Boolean);
    return types.sort();
  };

  // Value calculation functions
  const calculateTotalValue = (productList) => {
    return productList.reduce((total, product) => {
      return total + (product.quantity_available * product.selling_price);
    }, 0);
  };

  const getValueByStockLevel = (productList, stockLevel) => {
    let filteredProducts = productList;
    
    switch (stockLevel) {
      case 'in-stock':
        filteredProducts = productList.filter(p => p.quantity_available > 0);
        break;
      case 'low-stock':
        filteredProducts = productList.filter(p => p.is_low_stock);
        break;
      case 'out-of-stock':
        filteredProducts = productList.filter(p => p.quantity_available <= 0);
        break;
      default:
        filteredProducts = productList;
    }
    
    return calculateTotalValue(filteredProducts);
  };

  const getProductCountByStockLevel = (productList, stockLevel) => {
    let filteredProducts = productList;
    
    switch (stockLevel) {
      case 'in-stock':
        filteredProducts = productList.filter(p => p.quantity_available > 0);
        break;
      case 'low-stock':
        filteredProducts = productList.filter(p => p.is_low_stock);
        break;
      case 'out-of-stock':
        filteredProducts = productList.filter(p => p.quantity_available <= 0);
        break;
      default:
        filteredProducts = productList;
    }
    
    return filteredProducts.length;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Main filter logic
  const displayed = products.filter(p => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        p.device_name.toLowerCase().includes(searchTerm) ||
        p.dealer_name.toLowerCase().includes(searchTerm) ||
        p.device_model.toLowerCase().includes(searchTerm) ||
        p.dealer_location.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Device type filter
    if (filters.deviceType !== 'all' && p.device_type !== filters.deviceType) {
      return false;
    }

    // Location filter
    if (filters.location !== 'all' && p.dealer_location !== filters.location) {
      return false;
    }

    // Dealer filter
    if (filters.dealer !== 'all' && p.dealer_name !== filters.dealer) {
      return false;
    }

    // Availability filter
    if (filters.availability !== 'all') {
      if (filters.availability === 'available' && !p.is_available) return false;
      if (filters.availability === 'unavailable' && p.is_available) return false;
    }

    // Stock level filter
    if (filters.stockLevel !== 'all') {
      if (filters.stockLevel === 'in-stock' && p.quantity_available <= 0) return false;
      if (filters.stockLevel === 'low-stock' && !p.is_low_stock) return false;
      if (filters.stockLevel === 'out-of-stock' && p.quantity_available > 0) return false;
    }

    // Cost price range filter
    if (filters.costPriceMin && p.cost_price < parseFloat(filters.costPriceMin)) {
      return false;
    }
    if (filters.costPriceMax && p.cost_price > parseFloat(filters.costPriceMax)) {
      return false;
    }

    // Selling price range filter
    if (filters.sellingPriceMin && p.selling_price < parseFloat(filters.sellingPriceMin)) {
      return false;
    }
    if (filters.sellingPriceMax && p.selling_price > parseFloat(filters.sellingPriceMax)) {
      return false;
    }

    // Quantity range filter
    if (filters.quantityMin && p.quantity_available < parseFloat(filters.quantityMin)) {
      return false;
    }
    if (filters.quantityMax && p.quantity_available > parseFloat(filters.quantityMax)) {
      return false;
    }

    return true;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Product Management</h1>
        {role === 'MasterAdmin' && masterAdminName && (
          <div className="flex items-center space-x-2 text-sm text-gray-600 mt-2 sm:mt-0">
            <User className="h-4 w-4" />
            <span>Managing as: <span className="font-medium text-gray-800">{masterAdminName}</span></span>
          </div>
        )}
      </div>

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
            className="bg-[#f59e0b] hover:bg-[#d97706] text-white rounded-lg px-3 sm:px-4 py-2 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-6 space-y-4">
        {/* Search and Basic Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by device, dealer, model, or location…"
              value={filters.search}
              onChange={e => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
            />
          </div>

          {/* Basic Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {/* Device Type Filter */}
            <select
              value={filters.deviceType}
              onChange={e => handleFilterChange('deviceType', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] text-sm"
            >
              <option value="all">All Types</option>
              {getUniqueDeviceTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={filters.location}
              onChange={e => handleFilterChange('location', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] text-sm"
            >
              <option value="all">All Locations</option>
              {getUniqueLocations().map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>

            {/* Dealer Filter */}
            <select
              value={filters.dealer}
              onChange={e => handleFilterChange('dealer', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f59e0b] focus:border-[#f59e0b] text-sm"
            >
              <option value="all">All Dealers</option>
              {getUniqueDealers().map(dealer => (
                <option key={dealer} value={dealer}>{dealer}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          {/* Availability Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Availability:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'available', label: 'Available' },
                { value: 'unavailable', label: 'Unavailable' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={filters.availability === option.value}
                    onChange={e => handleFilterChange('availability', e.target.value)}
                    className="mr-1"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stock Level Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Stock Level:</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'in-stock', label: 'In Stock' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="stockLevel"
                    value={option.value}
                    checked={filters.stockLevel === option.value}
                    onChange={e => handleFilterChange('stockLevel', e.target.value)}
                    className="mr-1"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Total Value Display */}
          <div className="bg-gradient-to-r from-[#f59e0b]/5 to-[#f59e0b]/10 rounded-lg border border-[#f59e0b]/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                <label className="text-sm font-semibold text-gray-800 whitespace-nowrap">Total Value:</label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">All Products</div>
                  <div className="text-sm font-bold text-gray-900">
                    {formatCurrency(calculateTotalValue(displayed))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {displayed.length} products
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">In Stock</div>
                  <div className="text-sm font-bold text-green-600">
                    {formatCurrency(getValueByStockLevel(displayed, 'in-stock'))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getProductCountByStockLevel(displayed, 'in-stock')} products
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Low Stock</div>
                  <div className="text-sm font-bold text-yellow-600">
                    {formatCurrency(getValueByStockLevel(displayed, 'low-stock'))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getProductCountByStockLevel(displayed, 'low-stock')} products
                  </div>
                </div>
                <div className="text-center bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Out of Stock</div>
                  <div className="text-sm font-bold text-red-600">
                    {formatCurrency(getValueByStockLevel(displayed, 'out-of-stock'))}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {getProductCountByStockLevel(displayed, 'out-of-stock')} products
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center space-x-2 text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
          >
            <span>🔧 Advanced Filters</span>
            <span className={`transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Filter Count and Clear */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Showing {displayed.length} of {products.length} products
            </span>
            {getActiveFilterCount() > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Clear All ({getActiveFilterCount()})
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Price & Quantity Ranges</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cost Price Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price Range (₦)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.costPriceMin}
                    onChange={e => handleFilterChange('costPriceMin', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.costPriceMax}
                    onChange={e => handleFilterChange('costPriceMax', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                </div>
              </div>

              {/* Selling Price Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selling Price Range (₦)</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.sellingPriceMin}
                    onChange={e => handleFilterChange('sellingPriceMin', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.sellingPriceMax}
                    onChange={e => handleFilterChange('sellingPriceMax', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                </div>
              </div>

              {/* Quantity Range */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity Range</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.quantityMin}
                    onChange={e => handleFilterChange('quantityMin', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.quantityMax}
                    onChange={e => handleFilterChange('quantityMax', e.target.value)}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-[#f59e0b] focus:border-[#f59e0b]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {[
                "ID","Dealer","Location","Device",
                "Cost","Sell","Qty","Low","Avail","Profit","Expected Profit","Expected Selling","Actions"
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
              const expectedProfit = ((p.selling_price - p.cost_price) * p.quantity_available).toFixed(2);
              const expectedSelling = (p.selling_price * p.quantity_available).toFixed(2);
              return (
                <tr key={p.id} className={!p.is_available ? "opacity-50 bg-gray-50" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{p.dealer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.dealer_location}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="space-y-1">
                      <div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {p.device_type}
                        </span>
                      </div>
                      <div className="font-medium text-gray-900">{p.device_name}</div>
                      <div className="text-gray-600">{p.device_model}</div>
                    </div>
                  </td>
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
                    <span className={`font-medium ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{expectedProfit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="font-medium text-blue-600">
                      ₦{expectedSelling}
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

      {/* Mobile Card View - Mobile-First Design */}
      <div className="lg:hidden space-y-4">
        {displayed.length ? displayed.map(p => {
          const profit = (p.selling_price - p.cost_price).toFixed(2);
          const expectedProfit = ((p.selling_price - p.cost_price) * p.quantity_available).toFixed(2);
          const expectedSelling = (p.selling_price * p.quantity_available).toFixed(2);
          
          return (
            <MobileCard
              key={p.id}
              type="Action"
              title={p.device_name}
              description={`${p.device_model} • ${p.dealer_name}`}
              value={`₦${p.selling_price}`}
              icon={CheckCircle}
              actionButton={
                role === "MasterAdmin" ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="mobile-button-secondary text-sm px-3 py-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => confirmDelete(p)}
                      className="mobile-button text-sm px-3 py-1"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                  </div>
                ) : null
              }
            >
              <div className="space-y-3">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {p.device_type}
                    </span>
                  {p.is_low_stock && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ Low Stock
                    </span>
                  )}
                  {p.is_available ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Available
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Unavailable
                    </span>
                  )}
              </div>

              {/* Dealer Info */}
                <div className="text-sm text-gray-600">
                  <p className="font-medium">{p.dealer_name}</p>
                  <p>{p.dealer_location}</p>
              </div>

                {/* Pricing Grid */}
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Cost Price</p>
                  <p className="text-sm font-medium">₦{p.cost_price}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Selling Price</p>
                  <p className="text-sm font-medium">₦{p.selling_price}</p>
                </div>
              </div>

              {/* Quantity Control */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Quantity</span>
                  {role === "MasterAdmin" ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustQty(p.id, -1)}
                        disabled={p.quantity_available <= 0}
                        className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remove one"
                      >–</button>
                      <span className="font-medium min-w-[2rem] text-center">{p.quantity_available}</span>
                      <button
                        onClick={() => adjustQty(p.id, +1)}
                        className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded hover:bg-green-200"
                        title="Add one"
                      >+</button>
                    </div>
                  ) : (
                    <span className="font-medium">{p.quantity_available}</span>
                  )}
              </div>

              {/* Profit Info */}
                <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className={`text-sm font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{profit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Expected Profit</p>
                  <p className={`text-sm font-medium ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₦{expectedProfit}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Expected Selling</p>
                  <p className="text-sm font-medium text-blue-600">
                    ₦{expectedSelling}
                  </p>
                </div>
              </div>
                </div>
            </MobileCard>
          );
        }) : (
          <div className="mobile-card text-center py-8 text-gray-500">
            <p>No products found.</p>
          </div>
        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editing ? "Edit Product" : "Add New Product"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Recent Product Activities - MasterAdmin Only */}
      {(() => {
        console.log("🔍 Checking activity section conditions:");
        console.log("Role === 'MasterAdmin':", role === 'MasterAdmin');
        console.log("Product activities length:", productActivities.length);
        console.log("Product activities data:", productActivities);
        console.log("Should show section:", role === 'MasterAdmin' && productActivities.length > 0);
        return null;
      })()}
      {role === 'MasterAdmin' && (
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Activity className="h-5 w-5 text-[#f59e0b]" />
              <span>Recent Product Activities</span>
            </h2>
            <button
              onClick={() => setShowActivityHistory(!showActivityHistory)}
              className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
            >
              {showActivityHistory ? 'Hide' : 'View All'}
            </button>
          </div>
          
          <div className="space-y-3">
            {productActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">No Product Activities Yet</p>
                <p className="text-sm">Product activities will appear here when you add, update, or modify products.</p>
              </div>
            ) : (
              productActivities.slice(0, showActivityHistory ? productActivities.length : 5).map((activity, index) => (
              <div key={activity.id || index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActivityColor(activity.action_type)}`}>
                      {activity.action_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(activity.created_at)}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium">
                    {activity.actor_name} ({activity.actor_role})
                  </p>
                  <p className="text-sm text-gray-600">
                    {activity.description}
                  </p>
                  {activity.device_name && (
                    <p className="text-xs text-gray-500 mt-1">
                      Product: {activity.device_name} {activity.device_model} ({activity.device_type})
                    </p>
                  )}
                  {activity.quantity_change !== 0 && (
                    <p className="text-xs text-gray-500">
                      Quantity: {activity.quantity_change > 0 ? '+' : ''}{activity.quantity_change}
                    </p>
                  )}
                </div>
              </div>
            ))
            )}
          </div>
          
          {!showActivityHistory && productActivities.length > 5 && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowActivityHistory(true)}
                className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
              >
                Show {productActivities.length - 5} more activities
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
