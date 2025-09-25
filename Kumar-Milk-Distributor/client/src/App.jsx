import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/Register";
import AdminDashboard from "./pages/admin-dashboard/Home";
import Order from "./pages/admin-dashboard/Orders";
import CustomerDashboard from "./pages/customer-dashboard/index";
import PlaceOrder from "./pages/customer-dashboard/place-order/index";
import OngoingOrders from "./pages/customer-dashboard/orders/ongoing";
import OrderHistory from "./pages/customer-dashboard/orders/history";
import InventoryManagement from "./pages/admin-dashboard/inventory/index";
import MilkPrices from "./pages/Products";
import AdminLayout from "./Layouts/Adminlayout";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/prices" element={<MilkPrices />} />

        {/* Customer Routes */}
        <Route path="/customer-dashboard" element={<CustomerDashboard />} />
        <Route
          path="/customer-dashboard/place-order"
          element={<PlaceOrder />}
        />
        <Route path="/customer-dashboard/ongoing" element={<OngoingOrders />} />
        <Route path="/customer-dashboard/history" element={<OrderHistory />} />

        {/* Admin Routes with Sidebar */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route path="home" element={<AdminDashboard />} />
          <Route path="orders" element={<Order />} />
          <Route path="stocks" element={<InventoryManagement />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
