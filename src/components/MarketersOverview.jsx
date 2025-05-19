import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from "../api";

// Utility to format currency
const formatCurrency = (n) => `₦${n.toLocaleString()}`;

export default function MarketersOverview() {
  const stored = localStorage.getItem("user");
  const user = stored ? JSON.parse(stored) : {};
  const marketerName = user.first_name ? `${user.first_name} ${user.last_name}` : user.name || "You";

  const [stats, setStats] = useState({ totalOrders: 0, totalSales: 0, pendingOrders: 0, wallet: 0 });
  const [chartData, setChartData] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [period, setPeriod] = useState("This Week");

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("token");
      // fetch stats
      const { data: { orders, sales, pending, balance } } = await api.get("/marketer/stats", { headers: { Authorization: `Bearer ${token}` }, params: { period } });
      setStats({ totalOrders: orders, totalSales: sales, pendingOrders: pending, wallet: balance });
      // fetch chart series
      const { data: chart } = await api.get("/marketer/chart", { headers: { Authorization: `Bearer ${token}` }, params: { period } });
      setChartData(chart);
      // fetch recent
      const { data: { orders: recent } } = await api.get("/marketer/orders/recent", { headers: { Authorization: `Bearer ${token}` } });
      setRecentOrders(recent);
    }
    load();
  }, [period]);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex space-x-2">
          { ["This Week", "This Month", "This Year"].map(p => (
            <Button key={p} variant={p===period?"default":"outline"} size="sm" onClick={()=>setPeriod(p)}>
              {p}
            </Button>
          )) }
        </div>
        <Button size="sm">Export</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.totalOrders}</p>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">Orders placed in {period.toLowerCase()}</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs">Pending Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.pendingOrders}</p>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">Awaiting completion</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</p>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">Revenue in {period.toLowerCase()}</p>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.wallet)}</p>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-gray-500">Available to withdraw</p>
          </CardFooter>
        </Card>
      </div>

      {/* Main Content: Chart + Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={value=>value} />
                <Tooltip formatter={(value)=>(formatCurrency(value))} />
                <Bar dataKey="value" fill="var(--shadcn-primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentOrders.map(o => (
              <div key={o.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.customer_email}</p>
                </div>
                <p className="font-semibold text-sm">+{formatCurrency(o.amount)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
