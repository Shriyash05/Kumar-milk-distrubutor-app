import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const History = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          "/api/orders/history",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch history orders", err);
      }
    };

    fetchHistory();
  }, []);

  const handleRepeat = (order) => {
    const {
      _id,
      createdAt,
      status,
      paymentStatus,
      paymentScreenshot,
      ...repeatData
    } = order || {};

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    repeatData.deliveryDate = tomorrow.toISOString().split("T")[0];

    localStorage.setItem("editOrder", JSON.stringify(repeatData));
    navigate("/customer-dashboard/place-order");
  };

  const handleDownloadInvoice = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/orders/invoice/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Invoice download failed:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9FAFB] font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e3a8a] text-white p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-8">Kumar Milk Distributors</h1>
          <nav className="space-y-3">
            <button
              onClick={() => navigate("/customer-dashboard")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-[#314E9E] transition"
            >
              🛒 Place Order
            </button>
            <button
              onClick={() => navigate("/customer-dashboard/ongoing")}
              className="w-full text-left px-4 py-2 rounded-md hover:bg-[#314E9E] transition"
            >
              📦 Ongoing Orders
            </button>
            <button
              onClick={() => navigate("/customer-dashboard/history")}
              className="w-full text-left px-4 py-2 rounded-md bg-[#314E9E] font-medium"
            >
              🕒 Previous Orders
            </button>
          </nav>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem("token");
            navigate("/login");
          }}
          className="w-full text-left mt-6 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 transition"
        >
          🔓 Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        <h2 className="text-3xl font-semibold text-[#1E3A8A] mb-8">
          🕓 Order History
        </h2>
        {orders.length === 0 ? (
          <p className="text-gray-600">No past orders found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-6 shadow hover:shadow-xl transition border border-gray-200"
              >
                <h3 className="text-xl font-semibold text-[#1E3A8A] mb-2">
                  {order.shopName}
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Address:</strong> {order.address}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Delivery Time:</strong> {order.deliveryTime}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Payment Method:</strong> {order.paymentMethod}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Payment Status:</strong> {order.paymentStatus}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Total Amount:</strong> ₹{order.totalAmount}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <strong>Order Date:</strong>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>

                <div className="my-3 border-t pt-3">
                  <h4 className="text-sm font-semibold mb-1 text-[#1E3A8A]">
                    Ordered Items:
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {[
                      ["Amul Taaza", order.amulTaazaCrates],
                      ["Amul Gold", order.amulGoldCrates],
                      ["Amul Buffalo", order.amulBuffaloCrates],
                      ["Gokul Cow", order.gokulCowCrates],
                      ["Gokul Buffalo", order.gokulBuffaloCrates],
                      ["Gokul Full Cream", order.gokulFullCreamCrates],
                      ["Mahananda", order.mahanandaCrates],
                    ].map(
                      ([label, count]) =>
                        count > 0 && (
                          <li key={label}>
                            {label}: {count} crates
                          </li>
                        )
                    )}
                  </ul>
                </div>

                <div className="flex items-center justify-between mt-4 gap-2">
                  <button
                    onClick={() => handleRepeat(order)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🔁 Repeat Order
                  </button>
                  <button
                    onClick={() => handleDownloadInvoice(order._id)}
                    className="text-sm text-green-600 hover:underline"
                  >
                    📄 Download Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default History;
