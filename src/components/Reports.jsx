import React, { useEffect, useState } from "react";

function Reports() {
  const baseUrl = "http://localhost:5000";
  const token = localStorage.getItem("token");

  const [salesReport, setSalesReport] = useState(null);
  const [dealerPayments, setDealerPayments] = useState([]);
  const [marketerPayments, setMarketerPayments] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSalesReport = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/report/sales`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch sales report");
        const data = await res.json();
        setSalesReport(data);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchDealerPayments = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/report/dealer-payments`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch dealer payments");
        const data = await res.json();
        setDealerPayments(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchMarketerPayments = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/report/marketer-payments`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch marketer payments");
        const data = await res.json();
        setMarketerPayments(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchGeneralExpenses = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/report/general-expenses`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch general expenses");
        const data = await res.json();
        setGeneralExpenses(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSalesReport();
    fetchDealerPayments();
    fetchMarketerPayments();
    fetchGeneralExpenses();
  }, [baseUrl, token]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4">Sales Report</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {salesReport ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-100 p-3 rounded">
            <h3 className="font-semibold">Daily</h3>
            <p>Orders: {salesReport.daily.order_count}</p>
            <p>Total Sales: {salesReport.daily.total_sales}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <h3 className="font-semibold">Weekly</h3>
            <p>Orders: {salesReport.weekly.order_count}</p>
            <p>Total Sales: {salesReport.weekly.total_sales}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded">
            <h3 className="font-semibold">Monthly</h3>
            <p>Orders: {salesReport.monthly.order_count}</p>
            <p>Total Sales: {salesReport.monthly.total_sales}</p>
          </div>
        </div>
      ) : (
        <p>Loading sales report...</p>
      )}

      <h2 className="text-xl font-bold mb-4">Dealer Payment History</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 border px-2">Payment ID</th>
              <th className="py-2 border px-2">Dealer ID</th>
              <th className="py-2 border px-2">Amount</th>
              <th className="py-2 border px-2">Date</th>
              <th className="py-2 border px-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {dealerPayments.length ? dealerPayments.map(payment => (
              <tr key={payment.id}>
                <td className="py-1 border px-2">{payment.id}</td>
                <td className="py-1 border px-2">{payment.dealer_id}</td>
                <td className="py-1 border px-2">{payment.amount}</td>
                <td className="py-1 border px-2">{new Date(payment.payment_date).toLocaleString()}</td>
                <td className="py-1 border px-2">{payment.description}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center py-2">No dealer payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">Marketer Payment History</h2>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 border px-2">Payment ID</th>
              <th className="py-2 border px-2">Marketer ID</th>
              <th className="py-2 border px-2">Amount</th>
              <th className="py-2 border px-2">Date</th>
              <th className="py-2 border px-2">Description</th>
            </tr>
          </thead>
          <tbody>
            {marketerPayments.length ? marketerPayments.map(payment => (
              <tr key={payment.id}>
                <td className="py-1 border px-2">{payment.id}</td>
                <td className="py-1 border px-2">{payment.marketer_id}</td>
                <td className="py-1 border px-2">{payment.amount}</td>
                <td className="py-1 border px-2">{new Date(payment.payment_date).toLocaleString()}</td>
                <td className="py-1 border px-2">{payment.description}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="text-center py-2">No marketer payments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-bold mb-4">General Expenses</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 border px-2">Expense ID</th>
              <th className="py-2 border px-2">Amount</th>
              <th className="py-2 border px-2">Date</th>
              <th className="py-2 border px-2">Purpose</th>
            </tr>
          </thead>
          <tbody>
            {generalExpenses.length ? generalExpenses.map(expense => (
              <tr key={expense.id}>
                <td className="py-1 border px-2">{expense.id}</td>
                <td className="py-1 border px-2">{expense.expense_amount}</td>
                <td className="py-1 border px-2">{new Date(expense.expense_date).toLocaleString()}</td>
                <td className="py-1 border px-2">{expense.expense_purpose}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="text-center py-2">No expenses found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Reports;
