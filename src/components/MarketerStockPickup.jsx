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

  const user       = JSON.parse(localStorage.getItem("user") || "{}");
  const myLocation = user.location || "";

  const [dealers, setDealers]               = useState([]);
  const [products, setProducts]             = useState([]);
  const [pickups, setPickups]               = useState([]);
  const [selectedDealer, setSelectedDealer] = useState("");
  const [now, setNow]                       = useState(Date.now());
  const [transferringId, setTransferringId] = useState(null);
  const [transferTarget, setTransferTarget] = useState("");

  const selectedProductId = watch("product_id");
  const selectedProd      = products.find(p => p.product_id === +selectedProductId);

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

  function loadPickups() {
    api.get("/stock/marketer")
       .then(res => setPickups(res.data.data || []))
       .catch(console.error);
  }

  function formatRemaining(ms) {
    const hrs  = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${hrs}h ${mins}m ${secs}s`;
  }

  async function onSubmit(data) {
    if (!selectedDealer) {
      alert("Please select a dealer.");
      return;
    }
    try {
      await api.post("/stock", {
        dealer_unique_id: selectedDealer,
        product_id:       data.product_id,
        quantity:         data.quantity
      });
      alert("Pickup recorded!");
      reset();
      setSelectedDealer("");
      setProducts([]);
      loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error recording pickup");
    }
  }

  async function submitTransfer() {
    if (!transferTarget.trim()) {
      alert("Enter a name or unique ID to transfer to.");
      return;
    }
    try {
      await api.post(`/stock/${transferringId}/transfer`, {
        targetIdentifier: transferTarget.trim()
      });
      alert("Transfer requested!");
      setTransferringId(null);
      setTransferTarget("");
      loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error requesting transfer");
    }
  }

  async function submitReturn(id) {
    try {
      await api.patch(`/stock/${id}/return-request`);
      alert("Return requested!");
      loadPickups();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error requesting return");
    }
  }

  function handleDealerChange(e) {
    const uid = e.target.value;
    setSelectedDealer(uid);
    setProducts([]);
    if (!uid) return;
    api.get(`/stock/pickup/dealers/${uid}/products`)
       .then(res => setProducts(res.data.products || []))
       .catch(console.error);
  }

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-center">Stock Pickup</h1>

      {/* ── Pickup Form ───────────────── */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4"
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block mb-1 font-medium">Dealer</label>
            <select
              value={selectedDealer}
              onChange={handleDealerChange}
              disabled={isSubmitting}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">— choose dealer —</option>
              {dealers.map(d => (
                <option key={d.unique_id} value={d.unique_id}>
                  {d.business_name} ({d.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium">Product</label>
            <select
              {...register("product_id", { required: true })}
              disabled={isSubmitting || !selectedDealer}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">— choose product —</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>
                  {p.device_name} {p.device_model} — {p.qty_available} avail.
                </option>
              ))}
            </select>
            {errors.product_id && (
              <p className="text-red-500 text-sm">Please select a product.</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Quantity</label>
            <input
              type="number"
              min="1"
              max={selectedProd?.qty_available}
              {...register("quantity", {
                required: true,
                min: 1,
                max: selectedProd?.qty_available || 1
              })}
              disabled={isSubmitting || !selectedProd}
              className="w-full border rounded px-3 py-2"
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm">Invalid quantity.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 text-white font-semibold rounded transition ${
              isSubmitting ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving…" : "Record Pickup"}
          </button>
        </div>
      </form>

      {/* ── My Pickups ─────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Stock Pickups</h2>

        {/* Mobile: stacked cards */}
        <div className="sm:hidden space-y-4">
          {pickups.length === 0 ? (
            <p className="text-gray-500">No pickups yet.</p>
          ) : pickups.map(s => {
            const deadlineMs = new Date(s.deadline).getTime();
            const diff       = deadlineMs - now;
            const remaining  =
              s.status === "pending"
                ? formatRemaining(diff)
                : s.status === "expired"
                ? `${formatRemaining(now - deadlineMs)} ago`
                : "—";

            return (
              <div key={s.id} className="bg-white p-4 rounded-lg shadow">
                <div className="flex justify-between mb-2">
                  <span className="font-medium">
                    {s.device_name} {s.device_model}
                  </span>
                  <span className="text-sm text-gray-600">{s.status}</span>
                </div>
                <p className="text-sm"><strong>Qty:</strong> {s.quantity}</p>
                <p className="text-xs text-gray-500">
                  <strong>Picked:</strong>{" "}
                  {new Date(s.pickup_date).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  <strong>Remaining:</strong> {remaining}
                </p>
                {s.status === "pending" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={() => { setTransferringId(s.id); setTransferTarget(""); }}
                      className="flex-1 bg-yellow-500 text-white py-1 rounded"
                    >
                      Transfer
                    </button>
                    <button
                      onClick={() => submitReturn(s.id)}
                      className="flex-1 bg-red-500 text-white py-1 rounded"
                    >
                      Return
                    </button>
                  </div>
                )}
                {transferringId === s.id && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Target unique ID"
                      value={transferTarget}
                      onChange={e => setTransferTarget(e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={submitTransfer}
                        className="flex-1 bg-green-500 text-white py-1 rounded"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setTransferringId(null)}
                        className="flex-1 bg-gray-300 py-1 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tablet+ and desktop: table */}
        <div className="hidden sm:block bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase">
              <tr>
                {["Product","Qty","Picked","Deadline","Remaining","Status","Actions"].map((h, i) => (
                  <th key={i} className="px-4 py-2 text-left">{h}</th>
                ))}
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
                const deadlineMs = new Date(s.deadline).getTime();
                const diff       = deadlineMs - now;
                const remaining  =
                  s.status === "pending"
                    ? formatRemaining(diff)
                    : s.status === "expired"
                    ? `${formatRemaining(now - deadlineMs)} ago`
                    : "—";

                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {s.device_name} {s.device_model}
                    </td>
                    <td className="px-4 py-2">{s.quantity}</td>
                    <td className="px-4 py-2">{new Date(s.pickup_date).toLocaleString()}</td>
                    <td className="px-4 py-2">{new Date(s.deadline).toLocaleString()}</td>
                    <td className="px-4 py-2">{remaining}</td>
                    <td className="px-4 py-2">{s.status}</td>
                    <td className="px-4 py-2 space-x-2">
                      {s.status === "pending" && (
                        <>
                          {transferringId === s.id ? (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Target ID"
                                value={transferTarget}
                                onChange={e => setTransferTarget(e.target.value)}
                                className="border rounded px-2 py-1"
                              />
                              <button onClick={submitTransfer} className="bg-green-500 text-white px-2 py-1 rounded">
                                Send
                              </button>
                              <button onClick={() => setTransferringId(null)} className="bg-gray-300 px-2 py-1 rounded">
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setTransferringId(s.id); setTransferTarget(""); }}
                              className="bg-yellow-500 text-white px-2 py-1 rounded"
                            >
                              Transfer
                            </button>
                          )}
                          <button
                            onClick={() => submitReturn(s.id)}
                            className="bg-red-500 text-white px-2 py-1 rounded"
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
    </div>
  );
}
