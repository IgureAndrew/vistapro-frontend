import React, { useEffect, useState } from 'react';
import api from '../api/walletApi';

export default function MasterAdminWallet() {
  const [wallets, setWallets]       = useState([]);
  const [requests, setRequests]     = useState([]);
  const [loadingWallets, setLoadingWallets]   = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [error, setError]           = useState('');

  // 1) Load all marketers' balances
  const fetchWallets = async () => {
    setLoadingWallets(true);
    try {
      const { data } = await api.get('/master-admin/wallets');
      setWallets(data.wallets);
      setError('');
    } catch {
      setError('Failed to load wallet balances.');
    } finally {
      setLoadingWallets(false);
    }
  };

  // 2) Load pending withdrawal requests
  const fetchRequests = async () => {
    setLoadingRequests(true);
    try {
      const { data } = await api.get('/master-admin/requests');
      setRequests(data.requests);
      setError('');
    } catch {
      setError('Failed to load withdrawal requests.');
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchWallets();
    fetchRequests();
  }, []);

  // 3) Approve or reject a request
  const handleReview = async (id, action) => {
    try {
      await api.patch(`/master-admin/requests/${id}`, { action });
      // remove from UI
      setRequests(rs => rs.filter(r => r.id !== id));
      // refresh balances
      fetchWallets();
    } catch {
      alert(`Could not ${action} request #${id}`);
    }
  };

  // 4) Release all withheld balances
  const handleRelease = async () => {
    if (!window.confirm('Release all withheld balances now?')) return;
    try {
      await api.post('/master-admin/release-withheld');
      await fetchWallets();
      alert('Withheld balances released.');
    } catch {
      alert('Release failed.');
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50">

      {error && <div className="text-red-600">{error}</div>}

      {/* ─── Wallet Balances ────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-3">All Marketers’ Balances</h2>
        {loadingWallets
          ? <div>Loading balances…</div>
          : (
            <table className="w-full text-sm bg-white rounded shadow overflow-auto">
              <thead className="bg-gray-100">
                <tr>
                  {['Marketer','Total','Available','Withheld'].map(h => (
                    <th key={h} className="px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wallets.map(w => (
                  <tr key={w.user_unique_id} className="border-t">
                    <td className="px-3 py-2">{w.marketer_name}</td>
                    <td className="px-3 py-2">₦{w.total_balance.toLocaleString()}</td>
                    <td className="px-3 py-2">₦{w.available_balance.toLocaleString()}</td>
                    <td className="px-3 py-2">₦{w.withheld_balance.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        <button
          onClick={handleRelease}
          className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Release All Withheld
        </button>
      </section>

      {/* ─── Pending Withdrawals ─────────────────────────────── */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Pending Withdrawal Requests</h2>
        {loadingRequests
          ? <div>Loading requests…</div>
          : requests.length === 0
            ? <div>No pending requests.</div>
            : (
              <table className="w-full text-sm bg-white rounded shadow overflow-auto">
                <thead className="bg-gray-100">
                  <tr>
                    {['ID','Marketer','Amount','Fee','Total','Bank','Requested At','Actions']
                      .map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t">
                      <td className="px-3 py-2">{req.id}</td>
                      <td className="px-3 py-2">{req.marketer_name}</td>
                      <td className="px-3 py-2">₦{req.amount.toLocaleString()}</td>
                      <td className="px-3 py-2">₦{req.fee.toLocaleString()}</td>
                      <td className="px-3 py-2">₦{req.total.toLocaleString()}</td>
                      <td className="px-3 py-2">
                        {req.bank_name}<br/>
                        {req.account_name} ({req.account_number})
                      </td>
                      <td className="px-3 py-2">{new Date(req.requested_at).toLocaleString()}</td>
                      <td className="px-3 py-2 space-x-2">
                        <button
                          onClick={() => handleReview(req.id, 'approve')}
                          className="px-2 py-1 bg-green-600 text-white rounded"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(req.id, 'reject')}
                          className="px-2 py-1 bg-red-600 text-white rounded"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
        }
      </section>
    </div>
  );
}
