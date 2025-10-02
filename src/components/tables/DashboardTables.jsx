import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  Search,
  Filter
} from 'lucide-react';

// Generic table component
const DataTable = ({ title, description, columns, data, actions }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Columns
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Search and Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Filter data..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <ArrowUpDown className="w-3 h-3 cursor-pointer" />
                      )}
                    </div>
                  </th>
                ))}
                {actions && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-4 whitespace-nowrap text-sm">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Status badge component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    success: { color: "bg-green-100 text-green-800", text: "Success" },
    processing: { color: "bg-blue-100 text-blue-800", text: "Processing" },
    failed: { color: "bg-red-100 text-red-800", text: "Failed" },
    pending: { color: "bg-yellow-100 text-yellow-800", text: "Pending" },
    verified: { color: "bg-green-100 text-green-800", text: "Verified" },
    unverified: { color: "bg-gray-100 text-gray-800", text: "Unverified" }
  };
  
  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <Badge className={config.color}>
      {config.text}
    </Badge>
  );
};

export const getRoleTables = (role) => {
  const tableConfigs = {
    masteradmin: [
      {
        title: "Recent Users",
        description: "Manage user accounts and permissions",
        columns: [
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { name: "John Doe", email: "john@example.com", role: "Admin", status: "verified" },
          { name: "Jane Smith", email: "jane@example.com", role: "Marketer", status: "pending" },
          { name: "Bob Johnson", email: "bob@example.com", role: "Dealer", status: "verified" }
        ],
        actions: true
      },
      {
        title: "Order Management",
        description: "Track and manage all orders",
        columns: [
          { key: "orderId", label: "Order ID", sortable: true },
          { key: "customer", label: "Customer", sortable: true },
          { key: "amount", label: "Amount", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { orderId: "ORD-001", customer: "Alice Brown", amount: "₦15,000", status: "processing" },
          { orderId: "ORD-002", customer: "Charlie Davis", amount: "₦8,500", status: "success" },
          { orderId: "ORD-003", customer: "Diana Wilson", amount: "₦22,000", status: "failed" }
        ],
        actions: true
      }
    ],
    superadmin: [
      {
        title: "Team Management",
        description: "Manage assigned admins and marketers",
        columns: [
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "role", label: "Role", sortable: true },
          { key: "performance", label: "Performance", sortable: true }
        ],
        data: [
          { name: "Admin One", email: "admin1@example.com", role: "Admin", performance: "95%" },
          { name: "Admin Two", email: "admin2@example.com", role: "Admin", performance: "87%" }
        ],
        actions: true
      },
      {
        title: "Commission Tracking",
        description: "Track commission earnings",
        columns: [
          { key: "period", label: "Period", sortable: true },
          { key: "earnings", label: "Earnings", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { period: "January 2024", earnings: "₦45,000", status: "success" },
          { period: "February 2024", earnings: "₦52,000", status: "success" }
        ],
        actions: true
      }
    ],
    admin: [
      {
        title: "Assigned Marketers",
        description: "Manage your assigned marketers",
        columns: [
          { key: "name", label: "Name", sortable: true },
          { key: "email", label: "Email", sortable: true },
          { key: "orders", label: "Orders", sortable: true },
          { key: "performance", label: "Performance", sortable: true }
        ],
        data: [
          { name: "Marketer A", email: "marketera@example.com", orders: "23", performance: "92%" },
          { name: "Marketer B", email: "marketerb@example.com", orders: "18", performance: "85%" }
        ],
        actions: true
      },
      {
        title: "Order Processing",
        description: "Process and manage orders",
        columns: [
          { key: "orderId", label: "Order ID", sortable: true },
          { key: "marketer", label: "Marketer", sortable: true },
          { key: "amount", label: "Amount", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { orderId: "ORD-101", marketer: "Marketer A", amount: "₦12,000", status: "processing" },
          { orderId: "ORD-102", marketer: "Marketer B", amount: "₦8,500", status: "success" }
        ],
        actions: true
      }
    ],
    dealer: [
      {
        title: "Order History",
        description: "View all your orders",
        columns: [
          { key: "orderId", label: "Order ID", sortable: true },
          { key: "customer", label: "Customer", sortable: true },
          { key: "amount", label: "Amount", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { orderId: "ORD-201", customer: "Customer A", amount: "₦25,000", status: "success" },
          { orderId: "ORD-202", customer: "Customer B", amount: "₦18,500", status: "processing" }
        ],
        actions: true
      }
    ],
    marketer: [
      {
        title: "Your Orders",
        description: "Track your order history",
        columns: [
          { key: "orderId", label: "Order ID", sortable: true },
          { key: "customer", label: "Customer", sortable: true },
          { key: "amount", label: "Amount", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { orderId: "ORD-301", customer: "Client A", amount: "₦15,000", status: "success" },
          { orderId: "ORD-302", customer: "Client B", amount: "₦12,500", status: "processing" }
        ],
        actions: true
      },
      {
        title: "Stock Pickups",
        description: "Manage your stock pickups",
        columns: [
          { key: "pickupId", label: "Pickup ID", sortable: true },
          { key: "product", label: "Product", sortable: true },
          { key: "quantity", label: "Quantity", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (value) => <StatusBadge status={value} /> }
        ],
        data: [
          { pickupId: "PK-001", product: "Product A", quantity: "50", status: "success" },
          { pickupId: "PK-002", product: "Product B", quantity: "30", status: "processing" }
        ],
        actions: true
      }
    ]
  };

  return (tableConfigs[role] || tableConfigs.masteradmin).map(config => ({
    ...config,
    component: <DataTable {...config} />
  }));
};

export { DataTable, StatusBadge };
