// src/components/SuperAdminManageOrders.jsx
import React, { useState, useEffect } from "react";
import api from "../api"; // your axios instance

export default function SuperAdminManageOrders() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [confirming, setConfirming] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/manage-orders/orders/history");
      setOrders(data.orders);
    } catch (e) {
      console.error(e);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(orderId) {
    if (!window.confirm("Are you sure you want to confirm this order?")) return;
    setConfirming(cs => ({ ...cs, [orderId]: true }));
    try {
      await api.patch(`/manage-orders/orders/${orderId}/confirm`);
      await fetchOrders();
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to confirm");
    } finally {
      setConfirming(cs => ({ ...cs, [orderId]: false }));
    }
  }

  if (loading) return <p className="p-6">Loading orders…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Manage Orders</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500">No orders to display.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["ID","Marketer","Device","Model","Qty","Amount","Date","Status","Actions"]
                  .map(h => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{o.id}</td>
                  <td className="px-4 py-2">{o.marketer_name}</td>
                  <td className="px-4 py-2">{o.device_name}</td>
                  <td className="px-4 py-2">{o.device_model}</td>
                  <td className="px-4 py-2">{o.number_of_devices}</td>
                  <td className="px-4 py-2">₦{o.sold_amount.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    {new Date(o.sale_date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 capitalize">{o.status}</td>
                  <td className="px-4 py-2">
                    {o.status === "pending" && (
                      <button
                        onClick={() => handleConfirm(o.id)}
                        disabled={confirming[o.id]}
                        className={`
                          text-sm font-medium px-3 py-1 rounded
                          ${confirming[o.id]
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"}
                        `}
                      >
                        {confirming[o.id] ? "Confirming…" : "Confirm"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
