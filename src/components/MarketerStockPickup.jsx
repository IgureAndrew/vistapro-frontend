// src/components/MarketerStockPickup.jsx
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../api"; // axios instance with baseURL="/api"

export default function MarketerStockPickup() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm();

  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const myLocation  = currentUser.location || "";

  const [dealers, setDealers]               = useState([]);
  const [products, setProducts]             = useState([]);
  const [pickups, setPickups]               = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [now, setNow]                       = useState(Date.now());
  const [transferringId, setTransferringId] = useState(null);
  const [transferTarget, setTransferTarget] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    api.get("/stock/pickup/dealers")
       .then(res => setDealers(res.data.dealers || []))
       .catch(console.error);
    loadPickups();
  }, []);

  const loadPickups = () => {
    api.get("/stock/marketer")
       .then(res => setPickups(res.data.data || []))
       .catch(console.error);
  };

  const handleDealerChange = e => {
    const uid = e.target.value;
    setSelectedDealer(uid);
    setProducts([]);
    if (!uid) return;
    api.get(`/stock/pickup/dealers/${uid}/products`)
       .then(res => setProducts(res.data.products || []))
       .catch(console.error);
  };

  function formatRemaining(ms) {
    const hrs  = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${hrs}h ${mins}m ${secs}s`;
  }

  const onSubmit = async data => {
    if (!selectedDealer) return alert("Please select a dealer.");
    try {
      await api.post("/stock", {
        dealer_unique_id: selectedDealer,
        product_id:       data.product_id,
        quantity:         data.quantity
      });
      alert("Pickup recorded!");
      reset(); setSelectedDealer(""); setProducts([]); loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error recording pickup");
    }
  };

  const submitTransfer = async () => {
    if (!transferTarget.trim()) return alert("Enter a name or unique ID to transfer to.");
    try {
      await api.post(`/stock/${transferringId}/transfer`, { targetIdentifier: transferTarget.trim() });
      alert("Transfer requested!");
      setTransferringId(null); setTransferTarget(""); loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error requesting transfer");
    }
  };

  const submitReturn = async id => {
    try {
      await api.patch(`/stock/${id}/return-request`);
      alert("Return requested!");
      loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error requesting return");
    }
  };

  const selectedProductId = watch("product_id");
  const selectedProd      = products.find(p => p.product_id === +selectedProductId);

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Stock Pickup</h1>

      {/* ── Pickup Form ───────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {/* Dealer */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label className="block mb-1 font-medium">Dealer</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={selectedDealer}
            onChange={handleDealerChange}
            disabled={isSubmitting}
          >
            <option value="">— choose dealer —</option>
            {dealers.map(d => (
              <option key={d.unique_id} value={d.unique_id}>
                {d.business_name} ({d.location})
              </option>
            ))}
          </select>
        </div>

        {/* Product */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label className="block mb-1 font-medium">Product</label>
          <select
            className="w-full border rounded px-3 py-2"
            {...register("product_id", { required: "Select a product" })}
            disabled={isSubmitting || !selectedDealer}
          >
            <option value="">— choose product —</option>
            {products.map(p => (
              <option key={p.product_id} value={p.product_id}>
                {p.device_name} {p.device_model} — {p.qty_available} available
              </option>
            ))}
          </select>
          {errors.product_id && (
            <p className="text-red-500 text-sm mt-1">{errors.product_id.message}</p>
          )}
        </div>

        {/* Quantity */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <label className="block mb-1 font-medium">Quantity</label>
          <input
            type="number"
            min="1"
            max={selectedProd?.qty_available}
            className="w-full border rounded px-3 py-2"
            {...register("quantity", {
              required: "Quantity required",
              min: { value: 1, message: "At least 1" },
              validate: v => {
                const num = parseInt(v, 10);
                return !selectedProd || num <= selectedProd.qty_available ||
                  `Only ${selectedProd.qty_available} in stock`;
              }
            })}
            disabled={isSubmitting || !selectedProd}
          />
          {errors.quantity && (
            <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 text-white font-semibold rounded transition ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving…" : "Record Pickup"}
          </button>
        </div>
      </form>

      {/* ── My Pickups ─────────────────── */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="px-6 py-4 text-xl font-semibold">My Stock Pickups</h2>
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50 uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="hidden sm:table-cell px-4 py-2 text-left">Picked Up</th>
              <th className="hidden md:table-cell px-4 py-2 text-left">Deadline</th>
              <th className="px-4 py-2 text-left">Remaining</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pickups.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-500">
                  No pickups yet.
                </td>
              </tr>
            ) : pickups.map(s => {
              const label      = `${s.device_name} ${s.device_model}`;
              const deadlineMs = new Date(s.deadline).getTime();
              const diff       = deadlineMs - now;
              let remaining;
              if (s.status === "pending")   remaining = formatRemaining(diff);
              else if (s.status === "expired") remaining = <span className="text-red-600">{formatRemaining(now - deadlineMs)} ago</span>;
              else                            remaining = "—";

              const statusMap = {
                pending: "Pending",
                sold: "Sold",
                expired: "Expired",
                returned: "Returned",
                return_pending: "Return Pending"
              };
              const statusLabel = statusMap[s.status] || s.status.replace(/_/g, " ");
              const allowActions = s.status === "pending";

              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{label}</td>
                  <td className="px-4 py-2">{s.quantity}</td>
                  <td className="hidden sm:table-cell px-4 py-2">
                    {new Date(s.pickup_date).toLocaleString()}
                  </td>
                  <td className="hidden md:table-cell px-4 py-2">
                    {new Date(s.deadline).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{remaining}</td>
                  <td className="px-4 py-2">{statusLabel}</td>
                  <td className="px-4 py-2 space-x-2">
                    {allowActions && (
                      <>
                        {transferringId === s.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Target unique ID"
                              value={transferTarget}
                              onChange={e => setTransferTarget(e.target.value)}
                              className="w-full border rounded px-2 py-1"
                            />
                            <div className="flex space-x-2">
                              <button onClick={submitTransfer} className="flex-1 bg-green-500 px-2 py-1 text-white rounded">
                                Submit
                              </button>
                              <button onClick={() => setTransferringId(null)} className="flex-1 bg-gray-300 px-2 py-1 rounded">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setTransferringId(s.id); setTransferTarget(""); }}
                            className="bg-yellow-500 px-2 py-1 text-white rounded hover:bg-yellow-600"
                          >
                            Transfer
                          </button>
                        )}
                        <button
                          onClick={() => submitReturn(s.id)}
                          className="bg-red-500 px-2 py-1 text-white rounded hover:bg-red-600"
                        >
                          Return
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
