import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    shopName: "",
    deliveryDate: "",
    paymentStatus: "",
    status: "",
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          "/api/admin/orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: filters,
          }
        );

        setOrders(res.data);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [refresh, filters]); // ✅ add filters here!

  const handleUpdate = async (orderId, field, value) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `/api/admin/orders/${orderId}/status`,
        { [field]: value },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setRefresh(!refresh);
    } catch (err) {
      console.error("Failed to update order:", err);
    }
  };

  const handleCSVDownload = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "/api/admin/deliveries/csv",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "daily-deliveries.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("CSV Download failed:", err);
    }
  };

  return (
    <div className="p-6 bg-[#f5f7fb] min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-[#38251c]">
        Admin Dashboard
      </h1>

      <button
        onClick={handleCSVDownload}
        className="bg-[#4f83cc] hover:bg-[#3b6ea9] text-white font-medium px-5 py-2 rounded mb-6"
      >
        📥 Download Daily Deliveries CSV
      </button>
      {/* Filters */}
      <div className="bg-white p-4 mb-6 rounded shadow-md grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Shop Name"
          className="border px-3 py-2 rounded"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, shopName: e.target.value }))
          }
        />
        <input
          type="date"
          className="border px-3 py-2 rounded"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, deliveryDate: e.target.value }))
          }
        />
        <select
          className="border px-3 py-2 rounded"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))
          }
        >
          <option value="">All Payments</option>
          <option value="Paid">Paid</option>
          <option value="Unpaid">Unpaid</option>
          <option value="Pending">Pending</option>
        </select>
        <select
          className="border px-3 py-2 rounded"
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Delivered">Delivered</option>
        </select>
      </div>
      <button
        className="text-sm underline text-red-500 mt-1 ml-1"
        onClick={() => {
          setFilters({
            shopName: "",
            deliveryDate: "",
            paymentStatus: "",
            status: "",
          });
          setRefresh((prev) => !prev); // ✅ trigger refetch
        }}
      >
        Clear Filters
      </button>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <div className="card-body">
                <div className="loading-spinner mb-3"></div>
                <div className="text-muted text-small">Loading orders...</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded shadow-md">
          {previewImage && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
              <div className="relative bg-white rounded-lg p-4 shadow-lg flex flex-col items-center">
                {/* Close Button */}
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 right-2 text-gray-700 hover:text-red-500 text-xl font-bold"
                >
                  &times;
                </button>

                {/* Image Preview */}
                <img
                  src={previewImage}
                  alt="Full Screenshot"
                  className="max-w-3xl max-h-[75vh] rounded-md mb-4"
                />
              </div>
            </div>
          )}

          <table className="min-w-full bg-white text-sm text-left border border-gray-200">
            <thead className="bg-[#e9f1fb] text-[#2c3e50] font-semibold">
              <tr>
                <th className="px-4 py-3 border">Customer</th>
                <th className="px-4 py-3 border">Address</th>
                <th className="px-4 py-3 border">Date</th>
                <th className="px-4 py-3 border">Amul Buffalo</th>
                <th className="px-4 py-3 border">Amul Gold</th>
                <th className="px-4 py-3 border">Amul Taaza</th>
                <th className="px-4 py-3 border">Gokul Cow</th>
                <th className="px-4 py-3 border">Gokul Buffalo</th>
                <th className="px-4 py-3 border">Gokul Cream</th>
                <th className="px-4 py-3 border">Mahananda</th>
                <th className="px-4 py-3 border">Total</th>
                <th className="px-4 py-3 border">Screenshot</th>
                <th className="px-4 py-3 border">Payment</th>
                <th className="px-4 py-3 border">Delivery</th>
                <th className="px-4 py-3 border">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[#34495e]">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="15" className="px-4 py-8 text-center text-muted">No orders found.</td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order._id} className="hover:bg-[#f0f6fd]">
                  <td className="px-4 py-2 border">{order.shopName}</td>
                  <td className="px-4 py-2 border">{order.address}</td>
                  <td className="px-4 py-2 border">
                    {new Date(order.deliveryDate).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-2 border">
                    {order.amulBuffaloCrates}
                  </td>
                  <td className="px-4 py-2 border">{order.amulGoldCrates}</td>
                  <td className="px-4 py-2 border">{order.amulTaazaCrates}</td>
                  <td className="px-4 py-2 border">{order.gokulCowCrates}</td>
                  <td className="px-4 py-2 border">
                    {order.gokulBuffaloCrates}
                  </td>
                  <td className="px-4 py-2 border">
                    {order.gokulFullCreamCrates}
                  </td>
                  <td className="px-4 py-2 border">{order.mahanandaCrates}</td>
                  <td className="px-4 py-2 border font-semibold text-green-800">
                    ₹{order.totalAmount || 0}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {order.paymentScreenshot ? (
                      <button
                        onClick={() =>
                          setPreviewImage(
                            `/uploads/${order.paymentScreenshot}`
                          )
                        }
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        View
                      </button>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td className="px-4 py-2 border">{order.paymentStatus}</td>
                  <td className="px-4 py-2 border">{order.status}</td>
                  <td className="px-4 py-2 border space-y-2">
                    <button
                      className={`${
                        order.paymentStatus === "Paid"
                          ? "bg-gray-500"
                          : "bg-[#2ecc71]"
                      } text-white px-3 py-1 rounded w-full`}
                      onClick={() =>
                        handleUpdate(
                          order._id,
                          "paymentStatus",
                          order.paymentStatus === "Paid" ? "Unpaid" : "Paid"
                        )
                      }
                    >
                      {order.paymentStatus === "Paid"
                        ? "Mark Unpaid"
                        : "Mark Paid"}
                    </button>
                    <button
                      className={`${
                        order.status === "Delivered"
                          ? "bg-gray-500"
                          : "bg-[#3498db]"
                      } text-white px-3 py-1 rounded w-full`}
                      onClick={() =>
                        handleUpdate(
                          order._id,
                          "status",
                          order.status === "Delivered" ? "Pending" : "Delivered"
                        )
                      }
                    >
                      {order.status === "Delivered"
                        ? "Mark Undelivered"
                        : "Mark Delivered"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
