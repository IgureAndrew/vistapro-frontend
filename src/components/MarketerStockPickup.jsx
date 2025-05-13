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
  const [returningId, setReturningId]       = useState(null);

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

  const submitReturn = async (id) => {
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
    <div className="w-full">
      <h1 className="text-3xl font-bold">Stock Pickup</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded shadow space-y-4">
        <div>
          <label className="block font-semibold mb-1">Dealer</label>
          <select
            className="w-full border rounded p-2"
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

        <div>
          <label className="block font-semibold mb-1">Product</label>
          <select
            className="w-full border rounded p-2"
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
          {errors.product_id && <p className="text-red-500 text-sm mt-1">{errors.product_id.message}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            max={selectedProd?.qty_available}
            className="w-full border rounded p-2"
            {...register("quantity", {
              required: "Quantity required",
              min: { value: 1, message: "At least 1" },
              validate: v => {
                const num = parseInt(v, 10);
                return !selectedProd || num <= selectedProd.qty_available || `Only ${selectedProd.qty_available} in stock`;
              }
            })}
            disabled={isSubmitting || !selectedProd}
          />
          {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
        </div>

        <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {isSubmitting ? "Saving…" : "Record Pickup"}
        </button>
      </form>

      <div className="w-full mt-8">
        <h3 className="text-xl font-semibold mb-4">My Stock Pickups</h3>
        <div className="overflow-x-auto bg-white rounded shadow w-full">
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="px-4 py-2">Product</th>
                <th className="px-4 py-2">Qty</th>
                <th className="px-4 py-2">Picked Up</th>
                <th className="px-4 py-2">Deadline</th>
                <th className="px-4 py-2">Countdown</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Transfer / Return</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pickups.length === 0 ? (
                <tr><td colSpan={7} className="p-4 text-center text-gray-500">No pickups yet.</td></tr>
              ) : pickups.map(s => {
                const label      = `${s.device_name} ${s.device_model}`;
                const deadlineMs = new Date(s.deadline).getTime();
                const diff       = deadlineMs - now;
                let countdownCell;
                if (s.status === "pending") countdownCell = formatRemaining(diff);
                else if (s.status === "expired") countdownCell = <span className="text-red-600">{formatRemaining(now - deadlineMs)} ago</span>;
                else countdownCell = "–";
                const statusMap = { pending: "Pending", sold: "Sold", expired: "Expired", returned: "Returned", return_pending: "Return Pending" };
                const statusLabel = statusMap[s.status] || s.status.replace(/_/g, " ");
                const allowActions = s.status === "pending";
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{label}</td>
                    <td className="px-4 py-2">{s.quantity}</td>
                    <td className="px-4 py-2">{new Date(s.pickup_date).toLocaleString()}</td>
                    <td className="px-4 py-2">{new Date(s.deadline).toLocaleString()}</td>
                    <td className="px-4 py-2">{countdownCell}</td>
                    <td className="px-4 py-2">{statusLabel}</td>
                    <td className="px-4 py-2 space-x-2">
                      {allowActions && (transferringId === s.id ? (
                        <div className="space-y-1">
                          <p>Transfer <strong>{label}</strong> from <strong>{myLocation}</strong></p>
                          <input type="text" placeholder="Name or unique ID" value={transferTarget} onChange={e => setTransferTarget(e.target.value)} className="w-full border rounded px-2 py-1" />
                          <div className="flex space-x-2">
                            <button onClick={submitTransfer} className="px-2 py-1 bg-green-500 text-white rounded">Submit</button>
                            <button onClick={() => setTransferringId(null)} className="px-2 py-1 bg-gray-300 rounded">Cancel</button>
                          </div>
                        </div>
                      ) : (<button onClick={() => { setTransferringId(s.id); setReturningId(null); setTransferTarget(""); }} className="px-2 py-1 bg-yellow-500 text-white rounded">Transfer</button>))}
                      {allowActions && (
   <button
     onClick={() => submitReturn(s.id)}
     className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
   >
     Return
   </button>
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
