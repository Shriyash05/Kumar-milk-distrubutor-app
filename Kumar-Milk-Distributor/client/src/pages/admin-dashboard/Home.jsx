import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";

const COLORS = [
  "var(--accent-blue)",
  "var(--accent-green)",
  "var(--accent-orange)",
  "var(--accent-red)",
  "var(--primary-500)",
  "var(--primary-600)",
  "var(--primary-700)",
];

const Home = () => {
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        
        // Fetch admin dashboard summary
        const [summaryRes, ordersRes] = await Promise.all([
          axios.get(
            "/api/admin/dashboard",
            { headers: { Authorization: `Bearer ${token}` } }
          ),
          axios.get(
            "/api/admin/mobile-orders",
            { headers: { Authorization: `Bearer ${token}` } }
          )
        ]);
        
        setSummary(summaryRes.data);
        setOrders(ordersRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid-auto-fit">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="flex-between mb-4">
                  <div>
                    <div className="loading-spinner" />
                  </div>
                  <div className="loading-spinner" />
                </div>
                <div className="text-sm text-muted">Loading...</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary || !orders) {
    return (
      <div className="flex-center py-20">
        <div className="text-center">
          <p className="text-muted">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex-between">
        <div>
          <h1 className="heading-1">Dashboard Overview</h1>
          <p className="text-muted">Welcome back! Here's what's happening with your milk distribution business.</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted">Last updated</div>
          <div className="text-sm font-medium">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid-auto-fit">
        <div className="card">
          <div className="card-body">
            <div className="flex-between mb-4">
              <div>
                <p className="text-muted text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                  {summary.totalOrders}
                </p>
              </div>
              <div className="text-4xl opacity-20">📋</div>
            </div>
            <div className="text-sm text-muted">
              {orders?.summary?.recentOrders || 0} orders in last 24h
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex-between mb-4">
              <div>
                <p className="text-muted text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--accent-green)' }}>
                  ₹{summary.totalRevenue?.toLocaleString() || 0}
                </p>
              </div>
              <div className="text-4xl opacity-20">💰</div>
            </div>
            <div className="text-sm text-muted">
              ₹{orders?.summary?.pendingRevenue || 0} pending revenue
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex-between mb-4">
              <div>
                <p className="text-muted text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--accent-orange)' }}>
                  {summary.totalCustomers}
                </p>
              </div>
              <div className="text-4xl opacity-20">👥</div>
            </div>
            <div className="text-sm text-muted">
              Active customer base
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex-between mb-4">
              <div>
                <p className="text-muted text-sm font-medium">Order Items</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--primary-600)' }}>
                  {orders?.summary?.totalItems || 0}
                </p>
              </div>
              <div className="text-4xl opacity-20">📦</div>
            </div>
            <div className="text-sm text-muted">
              {orders?.summary?.totalQuantity || 0} total quantity
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="heading-4 mb-0">Order Status Distribution</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Delivered', value: summary.deliveredOrders, fill: COLORS[0] },
                    { name: 'Pending', value: summary.pendingOrders, fill: COLORS[1] },
                    { name: 'Confirmed', value: orders?.summary?.confirmedOrders || 0, fill: COLORS[2] },
                    { name: 'Cancelled', value: orders?.summary?.cancelledOrders || 0, fill: COLORS[3] },
                  ].filter(item => item.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Sources */}
        <div className="card">
          <div className="card-header">
            <h3 className="heading-4 mb-0">Order Sources</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {orders?.sources && Object.entries(orders.sources).map(([key, source], index) => (
                <div key={key} className="flex-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{source.icon}</span>
                    <div>
                      <div className="font-medium capitalize">{key}</div>
                      <div className="text-sm text-muted">{source.count} orders</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                      {source.percentage}%
                    </div>
                    <div 
                      className="w-20 h-2 rounded-full mt-1" 
                      style={{ backgroundColor: 'var(--neutral-gray-200)' }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${source.percentage}%`, 
                          backgroundColor: COLORS[index % COLORS.length] 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      <div className="card">
        <div className="card-header">
          <h3 className="heading-4 mb-0">Business Insights</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-blue)' }}>
                {orders?.insights?.multiItemOrderPercentage || 0}%
              </div>
              <div className="text-sm text-muted mt-1">Multi-item Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-green)' }}>
                {orders?.insights?.completionRate || 0}%
              </div>
              <div className="text-sm text-muted mt-1">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-orange)' }}>
                {orders?.insights?.subscriptionOrderPercentage || 0}%
              </div>
              <div className="text-sm text-muted mt-1">Subscription Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: 'var(--accent-red)' }}>
                {orders?.insights?.cancellationRate || 0}%
              </div>
              <div className="text-sm text-muted mt-1">Cancellation Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
