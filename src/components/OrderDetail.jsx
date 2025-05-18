// src/components/OrderDetail.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OrderDetail({ orderId, onClose }) {
  const [detail, setDetail] = useState(null);
  const [error, setError]   = useState('');

  useEffect(() => {
    if (!orderId) return;
    axios.get(
      `${import.meta.env.VITE_API_URL}/api/manage-orders/orders/${orderId}/detail`,
      {
        withCredentials: true,
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    )
    .then(r => setDetail(r.data[0] || null))
    .catch(e => setError(e.response?.data?.message || e.message));
  }, [orderId]);

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          ✕
        </button>
        <h3 className="text-lg font-semibold mb-4">Order #{orderId} Details</h3>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        {!detail ? (
          <p>Loading…</p>
        ) : (
          <table className="w-full text-left">
            <tbody>
              <tr>
                <th className="py-1">Name</th>
                <td className="py-1">{detail.device_name}</td>
              </tr>
              <tr>
                <th className="py-1">Model</th>
                <td className="py-1">{detail.device_model}</td>
              </tr>
              <tr>
                <th className="py-1">Type</th>
                <td className="py-1">{detail.device_type}</td>
              </tr>
              <tr>
                <th className="py-1">Unit Price</th>
                <td className="py-1">₦{detail.unit_price}</td>
              </tr>
              <tr>
                <th className="py-1">Qty</th>
                <td className="py-1">{detail.qty}</td>
              </tr>
              <tr>
                <th className="py-1">Revenue</th>
                <td className="py-1">₦{detail.total_revenue}</td>
              </tr>
              <tr>
                <th className="py-1">Profit Before</th>
                <td className="py-1">₦{detail.profit_before}</td>
              </tr>
              <tr>
                <th className="py-1">Expenses</th>
                <td className="py-1">₦{detail.total_expenses}</td>
              </tr>
              <tr>
                <th className="py-1">Profit After</th>
                <td className="py-1">₦{detail.profit_after}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
