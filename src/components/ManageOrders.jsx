// src/components/ManageOrders.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import OrderDetail from "./OrderDetail";

export default function ManageOrders() {
  const API_ROOT     = import.meta.env.VITE_API_URL + "/api/manage-orders";
  const PENDING_URL  = `${API_ROOT}/orders`;
  const HISTORY_URL  = `${API_ROOT}/orders/history`;
  const CONFIRM_URL  = id => `${API_ROOT}/orders/${id}/confirm`;
  const token        = localStorage.getItem("token");

  const [pending, setPending]         = useState([]);
  const [history, setHistory]         = useState([]);
  const [selected, setSelected]       = useState([]);
  const [error, setError]             = useState("");
  const [detailOrderId, setDetailOrderId] = useState(null);

  useEffect(() => {
    if (!token) return;
    axios.get(PENDING_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setPending(r.data.orders))
      .catch(e => setError(e.response?.data?.message || e.message));
    axios.get(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setHistory(r.data.orders))
      .catch(e => setError(e.response?.data?.message || e.message));
  }, [token]);

  const toggle = id => {
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    );
  };

  const confirmAll = async () => {
    if (!selected.length) return alert("Select at least one order");
    try {
      await Promise.all(
        selected.map(id =>
          axios.patch(
            CONFIRM_URL(id),
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      alert("Confirmed!");
      setSelected([]);
      // reload
      const [p, h] = await Promise.all([
        axios.get(PENDING_URL, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPending(p.data.orders);
      setHistory(h.data.orders);
    } catch (e) {
      alert(e.response?.data?.message || "Request failed");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow relative">
      <h2 className="text-xl font-semibold mb-4">Manage Orders</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Pending Orders */}
      <section className="mb-6">
        <h3 className="font-semibold mb-2">Pending Orders</h3>
        {pending.length === 0 ? (
          <p>No pending orders.</p>
        ) : (
          <>
            <table className="w-full table-auto mb-3 border">
              <thead className="bg-gray-100">
                <tr>
                  {["Select","ID","Marketer","BNPL","Device","Type","Qty","Amount","Date","Status","Detail"]
                    .map(h => (
                      <th key={h} className="px-2 py-1 border">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="border text-center">
                      <input
                        type="checkbox"
                        checked={selected.includes(o.id)}
                        onChange={() => toggle(o.id)}
                      />
                    </td>
                    <td className="border px-2">{o.id}</td>
                    <td className="border px-2">{o.marketer_name}</td>
                    <td className="border px-2">{o.bnpl_platform||"—"}</td>
                    <td className="border px-2">{o.device_name} {o.device_model}</td>
                    <td className="border px-2">{o.device_type}</td>
                    <td className="border px-2">{o.number_of_devices}</td>
                    <td className="border px-2">{o.sold_amount}</td>
                    <td className="border px-2">{new Date(o.sale_date).toLocaleString()}</td>
                    <td className="border px-2">{o.status}</td>
                    <td className="border px-2 text-center">
                      <button
                        onClick={() => setDetailOrderId(o.id)}
                        className="text-blue-600 underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={confirmAll}
              disabled={!selected.length}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Confirm Selected
            </button>
          </>
        )}
      </section>

      {/* Order History */}
      <section>
        <h3 className="font-semibold mb-2">Order History</h3>
        {history.length === 0 ? (
          <p>No order history.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead className="bg-gray-100">
              <tr>
                {["ID","Marketer","BNPL","Device","Type","Qty","Amount","Date","Status","Detail"]
                  .map(h => (
                    <th key={h} className="px-2 py-1 border">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {history.map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="border px-2">{o.id}</td>
                  <td className="border px-2">{o.marketer_name}</td>
                  <td className="border px-2">{o.bnpl_platform||"—"}</td>
                  <td className="border px-2">{o.device_name} {o.device_model}</td>
                  <td className="border px-2">{o.device_type}</td>
                  <td className="border px-2">{o.number_of_devices}</td>
                  <td className="border px-2">{o.sold_amount}</td>
                  <td className="border px-2">{new Date(o.sale_date).toLocaleString()}</td>
                  <td className="border px-2">{o.status}</td>
                  <td className="border px-2 text-center">
                    <button
                      onClick={() => setDetailOrderId(o.id)}
                      className="text-blue-600 underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {detailOrderId && (
        <OrderDetail
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
        />
      )}
    </div>
  );
}
