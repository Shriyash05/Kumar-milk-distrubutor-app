import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import PaymentQR from "../../../assets/qr-code.jpg";

const cratePrices = {
  amulTaazaCrates: 633.24,
  amulGoldCrates: 633,
  amulBuffaloCrates: 812.4,
  gokulCowCrates: 36,
  gokulBuffaloCrates: 36,
  gokulFullCreamCrates: 72,
  mahanandaCrates: 56,
};

const PlaceOrder = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shopName: "",
    address: "",
    deliveryTime: "",
    deliveryDate: "",
    amulTaazaCrates: 0,
    amulGoldCrates: 0,
    amulBuffaloCrates: 0,
    gokulCowCrates: 0,
    gokulBuffaloCrates: 0,
    gokulFullCreamCrates: 0,
    mahanandaCrates: 0,
    paymentMethod: "COD",
    paymentScreenshot: null,
  });

  const [isEditMode, setIsEditMode] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const calculateTotal = () => {
    return Object.keys(cratePrices).reduce((total, key) => {
      return total + (parseInt(form[key]) || 0) * cratePrices[key];
    }, 0);
  };

  useEffect(() => {
    const existingOrder = JSON.parse(localStorage.getItem("editOrder"));
    if (existingOrder) {
      setForm({
        shopName: existingOrder.shopName || "",
        address: existingOrder.address || "",
        deliveryTime: existingOrder.deliveryTime || "",
        deliveryDate: existingOrder.deliveryDate?.split("T")[0] || "",
        amulTaazaCrates: existingOrder.amulTaazaCrates || 0,
        amulGoldCrates: existingOrder.amulGoldCrates || 0,
        amulBuffaloCrates: existingOrder.amulBuffaloCrates || 0,
        gokulCowCrates: existingOrder.gokulCowCrates || 0,
        gokulBuffaloCrates: existingOrder.gokulBuffaloCrates || 0,
        gokulFullCreamCrates: existingOrder.gokulFullCreamCrates || 0,
        mahanandaCrates: existingOrder.mahanandaCrates || 0,
        paymentMethod: existingOrder.paymentMethod || "COD",
        paymentScreenshot: existingOrder.paymentScreenshot || null,
      });
      setIsEditMode(true);
      setOrderId(existingOrder._id);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm((prev) => ({
        ...prev,
        paymentScreenshot: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const isOnline = form.paymentMethod === "ONLINE";

      let dataToSend;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(isOnline && {
            "Content-Type": "multipart/form-data",
          }),
        },
      };

      if (isOnline) {
        dataToSend = new FormData();
        dataToSend.append("shopName", form.shopName);
        dataToSend.append("address", form.address);
        dataToSend.append("deliveryTime", form.deliveryTime);
        dataToSend.append("deliveryDate", form.deliveryDate);
        dataToSend.append("paymentMethod", form.paymentMethod);
        dataToSend.append("totalAmount", calculateTotal());

        // Crates
        dataToSend.append("amulTaazaCrates", form.amulTaazaCrates);
        dataToSend.append("amulGoldCrates", form.amulGoldCrates);
        dataToSend.append("amulBuffaloCrates", form.amulBuffaloCrates);
        dataToSend.append("gokulCowCrates", form.gokulCowCrates);
        dataToSend.append("gokulBuffaloCrates", form.gokulBuffaloCrates);
        dataToSend.append("gokulFullCreamCrates", form.gokulFullCreamCrates);
        dataToSend.append("mahanandaCrates", form.mahanandaCrates);

        // Image
        if (form.paymentScreenshot) {
          dataToSend.append("paymentScreenshot", form.paymentScreenshot);
        }
      } else {
        dataToSend = {
          ...form,
          totalAmount: calculateTotal(),
        };
      }

      if (isEditMode && orderId) {
        await axios.put(
          `/api/orders/${orderId}`,
          dataToSend,
          config
        );
        toast.success("Order updated successfully!");
      } else {
        await axios.post(
          "/api/orders/place",
          dataToSend,
          config
        );
        toast.success("Order placed successfully!");
      }

      localStorage.removeItem("editOrder");
      navigate("/customer-dashboard/ongoing");
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8f8f8]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1E3A8A] text-white p-6 space-y-6 hidden md:block shadow-md">
        <h2 className="text-2xl font-bold mb-8">Kumar Milk Distributors</h2>
        <nav className="space-y-4">
          <Link
            to="/customer-dashboard"
            className="block hover:bg-[#314E9E] hover:text-[#fff] px-4 py-2 rounded transition"
          >
            📊 Dashboard
          </Link>
          <Link
            to="/customer-dashboard/ongoing"
            className="block hover:bg-[#21242b] hover:text-[#fff] px-4 py-2 rounded transition"
          >
            📦 Ongoing Orders
          </Link>
          <Link
            to="/customer-dashboard/history"
            className="block hover:bg-[#314E9E] hover:text-[#fff] px-4 py-2 rounded transition"
          >
            🕒 Previous Orders
          </Link>
        </nav>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-[#1E3A8A] mb-6">
          {isEditMode ? "Edit Order" : "Place New Order"}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow space-y-6"
        >
          {/* Basic Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold">Shop Name</label>
              <input
                type="text"
                name="shopName"
                value={form.shopName}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold">Delivery Time</label>
              <input
                type="time"
                name="deliveryTime"
                value={form.deliveryTime}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
                min="04:00"
                max="07:00"
              />
              <p className="text-sm text-gray-500 mt-1">
                Allowed delivery time: 4:00 AM – 7:00 AM
              </p>
            </div>

            <div>
              <label className="block mb-1 font-semibold">Delivery Date</label>
              <input
                type="date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>

          {/* Crates Section */}
          <div>
            <h2 className="text-xl font-bold mb-2">Milk Crates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(cratePrices).map(([key, price]) => (
                <div key={key}>
                  <label className="block mb-1 font-medium">
                    {key.replace(/Crates$/, "").replace(/([A-Z])/g, " $1")} (₹
                    {price})
                  </label>
                  <input
                    type="number"
                    name={key}
                    value={form[key]}
                    onChange={handleChange}
                    className="w-full border p-2 rounded"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Total Price */}
          <div className="text-right text-xl font-semibold text-gray-800 mt-4">
            Total Amount: ₹{calculateTotal()}
          </div>

          {/* Payment Section */}
          <div>
            <label className="block font-semibold mb-1">Payment Method</label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="COD">Cash on Delivery</option>
              <option value="ONLINE">Online</option>
            </select>

            {form.paymentMethod === "ONLINE" && (
              <div className="mt-6 space-y-6">
                {/* QR Code Section */}
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
                    Scan QR Code to Pay
                  </h3>
                  <div className="flex justify-center">
                    <img
                      src={PaymentQR}
                      alt="Payment QR Code"
                      className="w-48 h-48 object-contain rounded"
                    />
                  </div>
                  <p className="text-center text-sm text-gray-600 mt-3">
                    <span className="font-medium">Amount:</span> ₹
                    {calculateTotal()}
                  </p>
                </div>

                {/* Upload Screenshot Section */}
                <div className="bg-white p-5 rounded-xl border shadow-sm">
                  <label
                    htmlFor="paymentScreenshot"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Upload Payment Screenshot{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="paymentScreenshot"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 p-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  {form.paymentScreenshot && (
                    <p className="text-sm text-green-600 mt-2">
                      Screenshot uploaded successfully
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-[#1E3A8A] text-white p-3 rounded hover:bg-[#483CCc] transition"
          >
            {isEditMode ? "Update Order" : "Place Order"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PlaceOrder;
