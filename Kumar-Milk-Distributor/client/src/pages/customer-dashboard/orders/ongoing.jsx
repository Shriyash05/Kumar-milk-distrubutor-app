import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Ongoing = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "/api/orders/ongoing",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setOrders(res.data);
      } catch (error) {
        console.error(
          "Error fetching orders:",
          error.response?.data || error.message
        );
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const isBeforeDeliveryBuffer = (deliveryDate, deliveryTime) => {
    const now = new Date();
    const deliveryDateTime = new Date(deliveryDate);
    const [hours, minutes] = deliveryTime.split(":").map(Number);
    deliveryDateTime.setHours(hours, minutes, 0, 0);
    const bufferTime = new Date(
      deliveryDateTime.getTime() - 2 * 60 * 60 * 1000
    );
    return now < bufferTime;
  };

  const handleEdit = (order) => {
    localStorage.setItem("editOrder", JSON.stringify(order));
    navigate("/customer-dashboard/place-order");
  };

  const handleDelete = async (orderId, deliveryDate, deliveryTime) => {
    if (!isBeforeDeliveryBuffer(deliveryDate, deliveryTime)) {
      alert("You can only delete the order before 2 hours of delivery.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(orders.filter((o) => o._id !== orderId));
      alert("Order deleted successfully.");
    } catch (error) {
      console.error(
        "Error deleting order:",
        error.response?.data || error.message
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen font-sans bg-[#F1F5F9]">
      {/* Sidebar */}
      <aside className="md:w-64 w-full bg-[#1E3A8A] text-white p-4 md:p-6 flex flex-col shadow-md">
        <div className="flex items-center justify-between md:block">
          <h1 className="text-xl md:text-2xl font-bold mb-4">
            Kumar Milk Distributors
          </h1>
          <button
            className="md:hidden text-white"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰
          </button>
        </div>

        {(menuOpen || window.innerWidth >= 768) && (
          <nav className="space-y-3 mt-2 md:mt-6 flex flex-col flex-grow">
            <button
              onClick={() => navigate("/customer-dashboard")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-[#314E9E] transition"
            >
              🛒 Place Order
            </button>
            <button
              onClick={() => navigate("/customer-dashboard/ongoing")}
              className="w-full text-left px-4 py-2 rounded-md bg-[#314E9E] text-white font-medium"
            >
              📦 Ongoing Orders
            </button>
            <button
              onClick={() => navigate("/customer-dashboard/history")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-[#314E9E] transition"
            >
              🕒 Previous Orders
            </button>

            <div className="mt-auto pt-4">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition"
              >
                🔓 Logout
              </button>
            </div>
          </nav>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10">
        <h2 className="text-2xl md:text-3xl font-semibold text-[#1E3A8A] mb-6">
          📋 Ongoing Orders
        </h2>

        {loading ? (
          <p className="text-gray-700">Loading...</p>
        ) : Array.isArray(orders) ? (
          orders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {orders.map((order, index) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-[#fff] rounded-2xl shadow p-5 border border-gray-300 hover:shadow-lg transition"
                >
                  <h3 className="text-lg font-semibold mb-3 text-[#1E3A8A]">
                    {order.shopName}
                  </h3>
                  <div className="text-sm text-[#4B5563] space-y-2">
                    <p>
                      <strong>Delivery Date:</strong>{" "}
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Delivery Time:</strong> {order.deliveryTime}
                    </p>
                    <p>
                      <strong>Amount:</strong> ₹{order.totalAmount}
                    </p>
                    <p>
                      <strong>Payment:</strong> {order.paymentMethod}
                    </p>
                    <div className="mt-3">
                      <strong>Status:</strong>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {[
                          "Pending",
                          "Ready for Pickup",
                          "Out for Delivery",
                          "Delivered",
                        ].map((stage, i) => (
                          <div key={stage} className="flex items-center gap-1">
                            <div
                              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                                order.status === stage ||
                                (order.status === "Out for Delivery" &&
                                  stage === "Ready for Pickup") ||
                                (order.status === "Delivered" &&
                                  [
                                    "Ready for Pickup",
                                    "Out for Delivery",
                                  ].includes(stage))
                                  ? "bg-green-600 scale-110"
                                  : "bg-gray-300"
                              }`}
                            ></div>
                            <span className="text-xs">{stage}</span>
                            {i !== 3 && (
                              <div className="w-4 border-t-2 border-gray-300" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <strong>Milk Crates:</strong>
                      <ul className="list-disc list-inside ml-4 space-y-1">
                        <li>Amul Taaza: {order.amulTaazaCrates}</li>
                        <li>Amul Gold: {order.amulGoldCrates}</li>
                        <li>Amul Buffalo: {order.amulBuffaloCrates}</li>
                        <li>Gokul Cow: {order.gokulCowCrates}</li>
                        <li>Gokul Buffalo: {order.gokulBuffaloCrates}</li>
                        <li>Gokul FullCream: {order.gokulFullCreamCrates}</li>
                        <li>Mahananda: {order.mahanandaCrates}</li>
                      </ul>
                    </div>
                  </div>

                  {isBeforeDeliveryBuffer(
                    order.deliveryDate,
                    order.deliveryTime
                  ) && (
                    <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
                      <button
                        onClick={() => handleEdit(order)}
                        className="bg-[#6BA368] text-white px-4 py-2 rounded-lg hover:bg-[#558a54] transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() =>
                          handleDelete(
                            order._id,
                            order.deliveryDate,
                            order.deliveryTime
                          )
                        }
                        className="bg-[#EF4444] text-white px-4 py-2 rounded-lg hover:bg-[#DC2626] transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-[#4B5563]">No ongoing orders found.</p>
          )
        ) : (
          <p className="text-red-500">
            Something went wrong. Try logging in again.
          </p>
        )}
      </main>
    </div>
  );
};

export default Ongoing;
