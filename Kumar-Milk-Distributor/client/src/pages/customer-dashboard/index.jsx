import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import logo from "../assets/logo.png";

const COLORS = [
  "var(--accent-blue)",
  "var(--accent-green)",
  "var(--accent-orange)",
  "var(--accent-red)",
  "var(--primary-500)",
  "var(--primary-600)",
  "var(--primary-700)",
];

const CustomerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "/api/customer/dashboard",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setDashboardData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { label: "Place Order", icon: "🛒", path: "/customer-dashboard/place-order", onClick: () => localStorage.removeItem("editOrder") },
    { label: "Active Orders", icon: "📦", path: "/customer-dashboard/ongoing" },
    { label: "Order History", icon: "🕒", path: "/customer-dashboard/history" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex-center" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex-center" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🧰</div>
          <h3 className="heading-3 mb-2">We couldn't load your dashboard</h3>
          <p className="text-muted">Please refresh or try again in a moment.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary mt-6">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { orders, stats } = dashboardData;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
      {/* Sidebar */}
      <aside 
        className="w-64 h-screen flex flex-col sticky top-0 border-r" 
        style={{ 
          backgroundColor: 'var(--neutral-white)',
          borderColor: 'var(--neutral-gray-200)'
        }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: 'var(--neutral-gray-200)' }}>
          <div className="flex items-center space-x-3">
            <img src={logo} alt="Kumar Milk Distributors" className="h-8 w-auto" />
            <div>
              <h2 className="heading-4 mb-0" style={{ color: 'var(--neutral-gray-900)' }}>
                Customer Portal
              </h2>
              <p className="text-xs text-muted">Kumar Milk Distributors</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-6">
          <div className="space-y-2">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  navigate(item.path);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm hover:bg-gray-50"
                style={{ color: 'var(--neutral-gray-700)' }}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-6 border-t" style={{ borderColor: 'var(--neutral-gray-200)' }}>
          <div className="mb-4">
            <div className="text-sm font-medium" style={{ color: 'var(--neutral-gray-900)' }}>
              Customer Dashboard
            </div>
            <div className="text-xs text-muted">Manage your milk orders</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-secondary w-full py-2 text-sm"
            style={{
              backgroundColor: 'var(--neutral-gray-100)',
              borderColor: 'var(--neutral-gray-300)',
              color: 'var(--neutral-gray-700)'
            }}
          >
            <span className="mr-2">🔓</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container max-w-none py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="heading-1">Welcome Back!</h1>
            <p className="text-muted">Here's an overview of your milk orders and account activity.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid-auto-fit mb-8">
            <div className="card">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <div>
                    <p className="text-muted text-sm font-medium">Total Orders</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                      {stats?.totalOrders || 0}
                    </p>
                  </div>
                  <div className="text-4xl opacity-20">📋</div>
                </div>
                <div className="text-sm text-muted">
                  All your orders to date
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <div>
                    <p className="text-muted text-sm font-medium">Delivered</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>
                      {stats?.deliveredOrders || 0}
                    </p>
                  </div>
                  <div className="text-4xl opacity-20">✅</div>
                </div>
                <div className="text-sm text-muted">
                  Successfully completed orders
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <div>
                    <p className="text-muted text-sm font-medium">Pending</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--accent-orange)' }}>
                      {stats?.pendingOrders || 0}
                    </p>
                  </div>
                  <div className="text-4xl opacity-20">🕰️</div>
                </div>
                <div className="text-sm text-muted">
                  Orders awaiting delivery
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <div>
                    <p className="text-muted text-sm font-medium">Total Spent</p>
                    <p className="text-3xl font-bold" style={{ color: 'var(--primary-600)' }}>
                      ₹{stats?.totalSpent?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="text-4xl opacity-20">💰</div>
                </div>
                <div className="text-sm text-muted">
                  {stats?.totalItems || 0} items, {stats?.totalQuantity || 0} quantity
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card mb-8">
            <div className="card-header">
              <div className="flex-between">
                <h3 className="heading-4 mb-0">Recent Orders</h3>
                <button 
                  onClick={() => navigate("/customer-dashboard/history")}
                  className="btn btn-secondary"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="card-body">
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div 
                      key={order._id} 
                      className="flex-between p-4 rounded-lg border"
                      style={{ borderColor: 'var(--neutral-gray-200)' }}
                    >
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">🥛</div>
                        <div>
                          <div className="font-medium">
                            {order.items ? 
                              `${order.items.length} item${order.items.length > 1 ? 's' : ''}` : 
                              order.productName
                            }
                          </div>
                          <div className="text-sm text-muted">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₹{order.totalAmount}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'delivered' ? 'badge-success' :
                          order.status === 'pending' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <h3 className="heading-4 mb-2">No Orders Yet</h3>
                  <p className="text-muted mb-6">Start by placing your first milk order</p>
                  <button 
                    onClick={() => navigate("/customer-dashboard/place-order")}
                    className="btn btn-primary"
                  >
                    Place Your First Order
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🛒</div>
                <h4 className="heading-4">Place Order</h4>
                <p className="text-muted mb-4">Order fresh milk for delivery</p>
                <button 
                  onClick={() => navigate("/customer-dashboard/place-order")}
                  className="btn btn-primary w-full"
                >
                  Order Now
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">📦</div>
                <h4 className="heading-4">Track Orders</h4>
                <p className="text-muted mb-4">Check your active orders</p>
                <button 
                  onClick={() => navigate("/customer-dashboard/ongoing")}
                  className="btn btn-secondary w-full"
                >
                  Track Orders
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-body text-center">
                <div className="text-4xl mb-4">🕒</div>
                <h4 className="heading-4">Order History</h4>
                <p className="text-muted mb-4">View past orders and receipts</p>
                <button 
                  onClick={() => navigate("/customer-dashboard/history")}
                  className="btn btn-secondary w-full"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, borderColor }) => (
  <div
    className={`bg-white p-6 rounded-xl shadow-md border-t-4`}
    style={{ borderTopColor: borderColor }}
  >
    <p className="text-gray-600 font-medium">{title}</p>
    <p className="text-3xl font-bold mt-2">{value}</p>
  </div>
);

const InfoBox = ({ color, label, value }) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-900",
    green: "bg-green-100 text-green-900",
    yellow: "bg-yellow-100 text-yellow-900",
  };

  return (
    <div
      className={`${colorMap[color]} p-4 rounded-lg shadow-sm font-semibold`}
    >
      {label}: {value}
    </div>
  );
};

export default CustomerDashboard;
