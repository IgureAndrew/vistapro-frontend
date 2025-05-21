// src/components/ManageOrders.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import OrderDetail from "./OrderDetail";

export default function ManageOrders() {
  const navigate = useNavigate();
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role        = currentUser.role;          // 'MasterAdmin', 'Admin', or 'SuperAdmin'
  const uid         = currentUser.unique_id;     // their own unique id
  const token       = localStorage.getItem("token");

  const API_ROOT     = import.meta.env.VITE_API_URL + "/api/manage-orders";
  const PENDING_URL  = `${API_ROOT}/orders`;
  const HISTORY_URL  = `${API_ROOT}/orders/history`;
  const CONFIRM_URL  = id => `${API_ROOT}/orders/${id}/confirm`;

  const [pending, setPending]             = useState([]);
  const [history, setHistory]             = useState([]);
  const [selected, setSelected]           = useState([]);
  const [error, setError]                 = useState("");
  const [detailOrderId, setDetailOrderId] = useState(null);

  // Fetch data
  useEffect(() => {
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    // MasterAdmin: load both pending & full history
    if (role === "MasterAdmin") {
      axios.get(PENDING_URL, { headers })
        .then(r => setPending(r.data.orders))
        .catch(e => setError(e.response?.data?.message || e.message));

      axios.get(HISTORY_URL, { headers })
        .then(r => setHistory(r.data.orders))
        .catch(e => setError(e.response?.data?.message || e.message));

    // Admin: only load their marketers' history
    } else if (role === "Admin") {
      axios.get(HISTORY_URL, {
        headers,
        params: { adminId: uid }
      })
        .then(r => setHistory(r.data.orders))
        .catch(e => setError(e.response?.data?.message || e.message));

    // SuperAdmin: only load history under their admins
    } else if (role === "SuperAdmin") {
      axios.get(HISTORY_URL, {
        headers,
        params: { superAdminId: uid }
      })
        .then(r => setHistory(r.data.orders))
        .catch(e => setError(e.response?.data?.message || e.message));

    // Others: redirect away
    } else {
      navigate("/dashboard");
    }
  }, [role, uid, token, navigate]);

  // toggle selection for MasterAdmin bulk‐confirm
  const toggle = id => {
    setSelected(sel =>
      sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]
    );
  };

  // MasterAdmin: confirm all selected
  const confirmAll = async () => {
    if (!selected.length) return alert("Select at least one order.");
    try {
      await Promise.all(
        selected.map(id =>
          axios.patch(CONFIRM_URL(id), {}, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      alert("Confirmed!");
      setSelected([]);
      // reload pending & history
      const [pRes, hRes] = await Promise.all([
        axios.get(PENDING_URL, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(HISTORY_URL, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPending(pRes.data.orders);
      setHistory(hRes.data.orders);
    } catch (e) {
      alert(e.response?.data?.message || "Failed to confirm.");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold">Manage Orders</h2>
      {error && <p className="text-red-500">{error}</p>}

      {/* ─── Pending (MasterAdmin only) ───────────────────────── */}
      {role === "MasterAdmin" && (
        <section>
          <h3 className="text-lg font-medium mb-3">Pending Orders</h3>
          {pending.length === 0 ? (
            <p>No pending orders.</p>
          ) : (
            <>
              <table className="w-full table-auto mb-4 border">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "Select","ID","Marketer","BNPL","Device",
                      "Type","Qty","Amount","Date","Status","Detail"
                    ].map(col => (
                      <th key={col} className="px-2 py-1 border text-sm">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="border px-2 text-center">
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
                      <td className="border px-2">₦{o.sold_amount}</td>
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
      )}

      {/* ─── Order History (All roles but filtered server‐side) ──── */}
      <section>
        <h3 className="text-lg font-medium mb-3">Order History</h3>
        {history.length === 0 ? (
          <p>No orders in history.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "ID","Marketer","BNPL","Device",
                  "Type","Qty","Amount","Date","Status","Detail"
                ].map(col => (
                  <th key={col} className="px-2 py-1 border text-sm">{col}</th>
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
                  <td className="border px-2">₦{o.sold_amount}</td>
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

      {/* ─── Detail Drawer ─────────────────────────────────────── */}
      {detailOrderId && (
        <OrderDetail
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
        />
      )}
    </div>
  );
}
