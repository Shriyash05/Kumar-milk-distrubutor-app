import React, { useEffect, useState } from "react";
import OrderPage from "../../Components/order";

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("home");

  const fetchOrders = () => {
    fetch("/api/orders/customer", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then((res) => res.json())
      .then(setOrders)
      .catch((err) => console.error("Error fetching orders:", err));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const notReceivedOrders = orders.filter(
    (order) => order.status !== "Delivered"
  );
  const pastOrders = orders.filter((order) => order.status === "Delivered");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-[#5b8db7] text-white p-6 space-y-4">
        <h2 className="text-2xl font-bold mb-4">Milk Dashboard</h2>
        {["home", "order", "history"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`block w-full text-left p-2 rounded hover:bg-[#45749a] ${
              activeTab === tab ? "bg-[#45749a]" : ""
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {activeTab === "home" && (
          <>
            <h3 className="text-2xl font-semibold text-[#5b8db7] mb-4">
              Pending Deliveries
            </h3>
            {notReceivedOrders.length === 0 ? (
              <p>No pending orders.</p>
            ) : (
              <ul>
                {notReceivedOrders.map((order) => (
                  <li
                    key={order._id}
                    className="bg-white p-4 mb-3 rounded shadow"
                  >
                    <p>
                      <strong>Shop:</strong> {order.shopName}
                    </p>
                    <p>
                      <strong>Delivery Time:</strong> {order.deliveryTime}
                    </p>
                    <p>
                      <strong>Status:</strong> {order.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {activeTab === "order" && (
          <>
            <h3 className="text-2xl font-semibold text-[#5b8db7] mb-4">
              Place New Order
            </h3>
            <OrderPage onOrderPlaced={fetchOrders} />
          </>
        )}

        {activeTab === "history" && (
          <>
            <h3 className="text-2xl font-semibold text-[#5b8db7] mb-4">
              Order History
            </h3>
            {pastOrders.length === 0 ? (
              <p>No order history yet.</p>
            ) : (
              <ul>
                {pastOrders.map((order) => (
                  <li
                    key={order._id}
                    className="bg-white p-4 mb-3 rounded shadow"
                  >
                    <p>
                      <strong>Shop:</strong> {order.shopName}
                    </p>
                    <p>
                      <strong>Delivery Time:</strong> {order.deliveryTime}
                    </p>
                    <p>
                      <strong>Payment:</strong>{" "}
                      {order.paymentStatus || "Pending"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
