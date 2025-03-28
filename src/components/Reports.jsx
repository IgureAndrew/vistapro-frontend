
import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

function Reports() {
  const baseUrl = "https://vistapro-backend.onrender.com";
  const token = localStorage.getItem("token");

  // Existing states for summary and tables
  const [salesReport, setSalesReport] = useState(null);
  const [dealerPayments, setDealerPayments] = useState([]);
  const [marketerPayments, setMarketerPayments] = useState([]);
  const [generalExpenses, setGeneralExpenses] = useState([]);
  const [error, setError] = useState("");

  // Chart data states
  const [deviceSalesData, setDeviceSalesData] = useState([]);
  const [profitData, setProfitData] = useState([]);

  // New state for detailed device sales (including device type, dealer price, marketer price)
  const [deviceSalesDetails, setDeviceSalesDetails] = useState([]);
  const [deviceFilterTerm, setDeviceFilterTerm] = useState("");

  useEffect(() => {
    const fetchSalesReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/sales`, {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/dealer-payments`, {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/marketer-payments`, {
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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/general-expenses`, {
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

    const fetchDeviceSalesReport = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/devices-sold?interval=daily`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch device sales report");
        const data = await res.json();
        setDeviceSalesData(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchProfitData = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/dailySalesProfitAnalysis`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch daily profit analysis");
        const data = await res.json();
        setProfitData(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    // New: Fetch detailed device sales information (device type, dealer & marketer prices)
    const fetchDeviceSalesDetails = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/report/device-sales-details`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch device sales details");
        const data = await res.json();
        setDeviceSalesDetails(data.data || []);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchSalesReport();
    fetchDealerPayments();
    fetchMarketerPayments();
    fetchGeneralExpenses();
    fetchDeviceSalesReport();
    fetchProfitData();
    fetchDeviceSalesDetails();
  }, [baseUrl, token]);

  // Prepare Device Sales Chart Data
  const uniquePeriods = [...new Set(deviceSalesData.map(item => new Date(item.period).toLocaleDateString()))];
  const deviceCategories = [...new Set(deviceSalesData.map(item => item.device_category))];
  const deviceSalesChartData = {
    labels: uniquePeriods,
    datasets: deviceCategories.map(category => ({
      label: category,
      data: uniquePeriods.map(period => {
        const record = deviceSalesData.find(item =>
          new Date(item.period).toLocaleDateString() === period &&
          item.device_category === category);
        return record ? parseInt(record.devices_sold, 10) : 0;
      }),
      backgroundColor: getRandomColor(),
    })),
  };

  // Prepare Profit Analysis Chart Data
  const profitChartData = {
    labels: profitData.map(item => new Date(item.day).toLocaleDateString()),
    datasets: [{
      label: "Gross Profit",
      data: profitData.map(item => parseFloat(item.grossProfit)),
      borderColor: "#4ade80",
      backgroundColor: "#bbf7d0",
      fill: false,
      tension: 0.3,
    }]
  };

  // Helper to generate random HEX color
  function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Filter device sales details using search input (device type, dealer price, marketer price)
  const filteredDeviceSalesDetails = deviceSalesDetails.filter(detail => {
    const search = deviceFilterTerm.toLowerCase();
    return (
      detail.device_category.toLowerCase().includes(search) ||
      detail.dealer_cost_price.toString().toLowerCase().includes(search) ||
      detail.marketer_selling_price.toString().toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Master Admin Report Dashboard</h1>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      
      {/* Sales Summary */}
      {salesReport ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-bold text-lg mb-2">Daily Sales</h2>
            <p>Orders: {salesReport.daily.order_count}</p>
            <p>Total Sales: {salesReport.daily.total_sales}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-bold text-lg mb-2">Weekly Sales</h2>
            <p>Orders: {salesReport.weekly.order_count}</p>
            <p>Total Sales: {salesReport.weekly.total_sales}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded shadow">
            <h2 className="font-bold text-lg mb-2">Monthly Sales</h2>
            <p>Orders: {salesReport.monthly.order_count}</p>
            <p>Total Sales: {salesReport.monthly.total_sales}</p>
          </div>
        </div>
      ) : (
        <p className="text-center">Loading sales report...</p>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Device Sales Bar Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Device Sales Report (Daily)</h2>
          <div className="h-64">
            <Bar 
              data={deviceSalesChartData} 
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { labels: { font: { weight: "bold" } } },
                },
                scales: {
                  x: { ticks: { font: { weight: "bold" } } },
                  y: { ticks: { font: { weight: "bold" } } },
                },
              }} 
            />
          </div>
        </div>

        {/* Profit Analysis Line Chart */}
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Daily Profit Analysis</h2>
          <div className="h-64">
            <Line 
              data={profitChartData} 
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: { labels: { font: { weight: "bold" } } },
                },
                scales: {
                  x: { ticks: { font: { weight: "bold" } } },
                  y: { ticks: { font: { weight: "bold" } } },
                },
              }} 
            />
          </div>
        </div>
      </div>

      {/* Device Sales Details with Filtering */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">Device Sales Details</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by device type, dealer price, or marketer price"
            value={deviceFilterTerm}
            onChange={(e) => setDeviceFilterTerm(e.target.value)}
            className="border border-gray-300 rounded px-4 py-2 w-full"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 border px-2 font-bold">Order ID</th>
                <th className="py-2 border px-2 font-bold">Device Type</th>
                <th className="py-2 border px-2 font-bold">Dealer Price</th>
                <th className="py-2 border px-2 font-bold">Marketer Price</th>
                <th className="py-2 border px-2 font-bold">Sale Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeviceSalesDetails.length ? filteredDeviceSalesDetails.map(detail => (
                <tr key={detail.id} className="hover:bg-gray-50">
                  <td className="py-1 border px-2">{detail.id}</td>
                  <td className="py-1 border px-2">{detail.device_category}</td>
                  <td className="py-1 border px-2">{detail.dealer_cost_price}</td>
                  <td className="py-1 border px-2">{detail.marketer_selling_price}</td>
                  <td className="py-1 border px-2">{new Date(detail.created_at).toLocaleString()}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="text-center py-2">No device sales details found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Histories & Expenses Tables */}
      <div className="grid grid-cols-1 gap-8">
        {/* Dealer Payment History */}
        <div>
          <h2 className="text-xl font-bold mb-4">Dealer Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 border px-2 font-bold">Payment ID</th>
                  <th className="py-2 border px-2 font-bold">Dealer ID</th>
                  <th className="py-2 border px-2 font-bold">Amount</th>
                  <th className="py-2 border px-2 font-bold">Date</th>
                  <th className="py-2 border px-2 font-bold">Description</th>
                </tr>
              </thead>
              <tbody>
                {dealerPayments.length ? dealerPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
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
        </div>

        {/* Marketer Payment History */}
        <div>
          <h2 className="text-xl font-bold mb-4">Marketer Payment History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 border px-2 font-bold">Payment ID</th>
                  <th className="py-2 border px-2 font-bold">Marketer ID</th>
                  <th className="py-2 border px-2 font-bold">Amount</th>
                  <th className="py-2 border px-2 font-bold">Date</th>
                  <th className="py-2 border px-2 font-bold">Description</th>
                </tr>
              </thead>
              <tbody>
                {marketerPayments.length ? marketerPayments.map(payment => (
                  <tr key={payment.id} className="hover:bg-gray-50">
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
        </div>

        {/* General Expenses */}
        <div>
          <h2 className="text-xl font-bold mb-4">General Expenses</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 border px-2 font-bold">Expense ID</th>
                  <th className="py-2 border px-2 font-bold">Amount</th>
                  <th className="py-2 border px-2 font-bold">Date</th>
                  <th className="py-2 border px-2 font-bold">Purpose</th>
                </tr>
              </thead>
              <tbody>
                {generalExpenses.length ? generalExpenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50">
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
      </div>
    </div>
  );
}

export default Reports;
