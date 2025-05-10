// src/components/SuperAdminWallet.jsx
import React, { useEffect, useState } from 'react';
import { Wallet, CreditCard, ArrowUpCircle } from 'lucide-react';
import walletApi from '../api/walletApi'; // axios with baseURL="/api/wallets"

export default function SuperAdminWallet() {
  // 1) your own wallet
  const [ownWallet, setOwnWallet] = useState({
    total_balance:     0,
    available_balance: 0,
    withheld_balance:  0,
  });

  // 2) all admins & marketers under you
  const [childWallets, setChildWallets] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // withdrawal form state
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [acctName,    setAcctName]    = useState('');
  const [acctNo,      setAcctNo]      = useState('');
  const [bankName,    setBankName]    = useState('');
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      try {
        // A) fetch your own wallet
        const ownRes = await walletApi.get(`/super-admin/my`);
        // B) fetch subordinates' wallets
        const subRes = await walletApi.get(`/super-admin/activities`);

        if (!mounted) return;
        setOwnWallet(ownRes.data.wallet || {});
        setChildWallets(subRes.data.wallets || []);
      } catch (e) {
        console.error(e);
        if (mounted) setError('Failed to load wallets');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAll();
    return () => { mounted = false };
  }, []);

  const handleWithdraw = async e => {
    e.preventDefault();
    if (!withdrawAmt || !acctName || !acctNo || !bankName) {
      return alert('All fields are required');
    }
    setSubmitting(true);
    try {
      // POST to /api/wallets/withdraw
      await walletApi.post(`/withdraw`, {
        amount:         Number(withdrawAmt),
        account_name:   acctName,
        account_number: acctNo,
        bank_name:      bankName
      });
      alert('Withdrawal request submitted');
      // reload just your wallet
      const { data } = await walletApi.get(`/`);
      setOwnWallet(data.wallet || {});
    } catch (e) {
      console.error(e);
      alert(e.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
      setWithdrawAmt('');
      setAcctName('');
      setAcctNo('');
      setBankName('');
    }
  };

  if (loading) return <p className="p-6">Loading…</p>;
  if (error)   return <p className="p-6 text-red-600">{error}</p>;

  const {
    total_balance     = 0,
    available_balance = 0,
    withheld_balance  = 0
  } = ownWallet;

  return (
    <div className="p-6 space-y-8">
      {/* Your Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          label: 'Total Balance',
          value: total_balance,
          icon:  <Wallet    className="w-6 h-6" />
        },{
          label: 'Available',
          value: available_balance,
          icon:  <span className="text-indigo-600 text-xl">₦</span>
        },{
          label: 'Withheld',
          value: withheld_balance,
          icon:  <CreditCard className="w-6 h-6" />
        }].map(({ label, value, icon }) => (
          <div key={label}
            className="bg-white p-5 rounded-lg shadow flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
              {icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold">
                ₦{value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Withdraw Form */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ArrowUpCircle /> Withdraw Funds
        </h2>
        <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="₦ Amount"
            value={withdrawAmt}
            onChange={e => setWithdrawAmt(e.target.value)}
            className="border rounded p-2 w-full"
            min="1"
            max={available_balance}
            required
          />
          <input
            type="text"
            placeholder="Account Name"
            value={acctName}
            onChange={e => setAcctName(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="text"
            placeholder="Account Number"
            value={acctNo}
            onChange={e => setAcctNo(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <input
            type="text"
            placeholder="Bank Name"
            value={bankName}
            onChange={e => setBankName(e.target.value)}
            className="border rounded p-2 w-full"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className={`col-span-full bg-indigo-600 text-white py-2 rounded ${
              submitting
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Submitting…' : 'Request Withdrawal'}
          </button>
        </form>
      </div>

      {/* All Admin & Marketer Wallets */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="p-4 text-lg font-semibold">
          All Admin & Marketer Wallets
        </h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID','Role','Total','Available','Withheld'].map(hdr => (
                <th key={hdr}
                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {childWallets.map(w => (
              <tr key={w.user_unique_id}>
                <td className="px-4 py-2 text-sm">{w.user_unique_id}</td>
                <td className="px-4 py-2 text-sm capitalize">{w.role}</td>
                <td className="px-4 py-2 text-sm">
                  ₦{w.total_balance.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  ₦{w.available_balance.toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  ₦{w.withheld_balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
