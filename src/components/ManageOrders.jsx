import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ManageOrders() {
  const navigate    = useNavigate();
  const stored      = localStorage.getItem("user");
  const currentUser = stored ? JSON.parse(stored) : {};
  const role        = currentUser.role;          
  const uid         = currentUser.unique_id;     
  const token       = localStorage.getItem("token");

  const API_ROOT     = import.meta.env.VITE_API_URL + "/api/manage-orders";
  const PENDING_URL  = `${API_ROOT}/orders`;
  const HISTORY_URL  = `${API_ROOT}/orders/history`;
  const CONFIRM_URL  = id => `${API_ROOT}/orders/${id}/confirm`;
  const CANCEL_URL   = id => `${API_ROOT}/orders/${id}/cancel`;

  const [pending, setPending]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError]       = useState("");

  // Date filters
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  // reload both lists
  const reload = () => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };

    if (role === "MasterAdmin") {
      axios.get(PENDING_URL, { headers })
           .then(r => setPending(r.data.orders))
           .catch(e => setError(e.response?.data?.message || e.message));
      axios.get(HISTORY_URL, { headers })
           .then(r => setHistory(r.data.orders))
           .catch(e => setError(e.response?.data?.message || e.message));
    } else if (role === "Admin") {
      axios.get(HISTORY_URL, { headers, params: { adminId: uid } })
           .then(r => setHistory(r.data.orders))
           .catch(e => setError(e.response?.data?.message || e.message));
    } else if (role === "SuperAdmin") {
      axios.get(HISTORY_URL, { headers, params: { superAdminId: uid } })
           .then(r => setHistory(r.data.orders))
           .catch(e => setError(e.response?.data?.message || e.message));
    } else {
      navigate("/dashboard");
    }
  };

  useEffect(reload, [role, uid, token, navigate]);

  // toggle bulk‐select
  const toggle = id => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  // confirm selected
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
      reload();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to confirm.");
    }
  };

  // cancel one
  const cancelOne = async id => {
    if (!window.confirm("Really cancel this order?")) return;
    try {
      await axios.patch(CANCEL_URL(id), {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Order canceled and inventory returned.");
      reload();
    } catch (e) {
      alert(e.response?.data?.message || "Failed to cancel.");
    }
  };

  // date‐range matcher
  const inRange = o => {
    const sd = new Date(o.sale_date);
    if (fromDate && sd < new Date(fromDate)) return false;
    if (toDate   && sd > new Date(toDate  + "T23:59:59")) return false;
    return true;
  };

  return (
    <div className="p-6 bg-white rounded shadow space-y-8">
      <h2 className="text-2xl font-semibold">Manage Orders</h2>
      {error && <p className="text-red-500">{error}</p>}

      {/* Date Filter */}
      <div className="flex space-x-4 mb-6">
        <div>
          <label className="block text-sm">From:</label>
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm">To:</label>
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* Pending (MasterAdmin) */}
      {role === "MasterAdmin" && (
        <section>
          <h3 className="text-lg font-medium mb-3">Pending Orders</h3>
          {pending.filter(inRange).length === 0 ? (
            <p>No pending orders in that range.</p>
          ) : (
            <>
              <table className="w-full table-auto mb-4 border">
                <thead className="bg-gray-100">
                  <tr>
                    {[
                      "Select","ID","Marketer","BNPL","Device",
                      "Type","Qty","Amount","Date","Status",
                      "IMEIs","Cancel"
                    ].map(col => (
                      <th
                        key={col}
                        className="px-2 py-1 border text-sm"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pending.filter(inRange).map(o => (
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
                      <td className="border px-2">
                        {o.device_name} {o.device_model}
                      </td>
                      <td className="border px-2">{o.device_type}</td>
                      <td className="border px-2">{o.number_of_devices}</td>
                      <td className="border px-2">₦{o.sold_amount}</td>
                      <td className="border px-2">
                        {new Date(o.sale_date).toLocaleString()}
                      </td>
                      <td className="border px-2">{o.status}</td>
                      <td className="border px-2 whitespace-nowrap text-xs">
                        {(o.imeis||[]).slice(0,3).join(", ")}
                        {o.imeis?.length>3
                          ? ` +${o.imeis.length-3}`
                          : ""}
                      </td>
                      <td className="border px-2 text-center">
                        <button
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                          onClick={() => cancelOne(o.id)}
                        >
                          Cancel
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

      {/* History */}
      <section>
        <h3 className="text-lg font-medium mb-3">Order History</h3>
        {history.filter(inRange).length === 0 ? (
          <p>No orders in history for that date range.</p>
        ) : (
          <table className="w-full table-auto border">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "ID","Marketer","BNPL","Device",
                  "Type","Qty","Amount","Date","Status","IMEIs"
                ].map(col => (
                  <th
                    key={col}
                    className="px-2 py-1 border text-sm"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.filter(inRange).map(o => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="border px-2">{o.id}</td>
                  <td className="border px-2">{o.marketer_name}</td>
                  <td className="border px-2">{o.bnpl_platform||"—"}</td>
                  <td className="border px-2">
                    {o.device_name} {o.device_model}
                  </td>
                  <td className="border px-2">{o.device_type}</td>
                  <td className="border px-2">{o.number_of_devices}</td>
                  <td className="border px-2">₦{o.sold_amount}</td>
                  <td className="border px-2">
                    {new Date(o.sale_date).toLocaleString()}
                  </td>
                  <td className="border px-2">{o.status}</td>
                  <td className="border px-2 whitespace-nowrap text-xs">
                    {(o.imeis||[]).slice(0,3).join(", ")}
                    {o.imeis?.length>3
                      ? ` +${o.imeis.length-3}`
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
