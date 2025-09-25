import React, { useState } from "react";

const OrderPage = ({ onOrderPlaced }) => {
  const initialForm = {
    shopName: "",
    address: "",
    deliveryTime: "",
    amulTaazaCrates: 0,
    amulGoldCrates: 0,
    amulBuffaloCrates: 0,
    gokulCowCrates: 0,
    gokulBuffaloCrates: 0,
    gokulFullCreamCrates: 0,
    mahanandaCrates: 0,
  };

  const [form, setForm] = useState(initialForm);
  const [timeError, setTimeError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "deliveryTime") {
      const [hour, minute] = value.split(":").map(Number);
      const totalMinutes = hour * 60 + minute;
      setTimeError(totalMinutes < 240 || totalMinutes > 420);
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (timeError) {
      alert("Please select a delivery time between 4:00 AM and 7:00 AM.");
      return;
    }

    const totalCrates =
      +form.amulTaazaCrates +
      +form.amulGoldCrates +
      +form.amulBuffaloCrates +
      +form.gokulCowCrates +
      +form.gokulBuffaloCrates +
      +form.gokulFullCreamCrates +
      +form.mahanandaCrates;

    if (totalCrates === 0) {
      alert("Please order at least one crate.");
      return;
    }

    const token = localStorage.getItem("token");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (res.ok) {
        alert("✅ Order placed successfully!");
        setForm(initialForm);
        if (onOrderPlaced) onOrderPlaced(); // optional callback
      } else {
        alert("❌ Failed to place order: " + (data.message || "Server error"));
      }
    } catch (err) {
      setLoading(false);
      alert("❌ Something went wrong. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg mt-8 rounded-lg">
      <h1 className="text-2xl font-bold text-[#5b8db7] mb-4">
        Place Your Order
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="shopName"
          value={form.shopName}
          placeholder="Shop Name"
          required
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />
        <textarea
          name="address"
          value={form.address}
          placeholder="Address"
          required
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        />

        <label className="block font-medium">
          Delivery Timing (4 AM - 7 AM)
        </label>
        <input
          type="time"
          name="deliveryTime"
          value={form.deliveryTime}
          required
          onChange={handleChange}
          className={`w-full border px-3 py-2 rounded ${
            timeError ? "border-red-500" : ""
          }`}
        />
        {timeError && (
          <p className="text-red-500 text-sm">
            Please select a time between 4:00 AM and 7:00 AM.
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mt-4">Amul Milk Products</h2>
            <input
              type="number"
              name="amulTaazaCrates"
              value={form.amulTaazaCrates}
              placeholder="Amul Taaza Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
            <input
              type="number"
              name="amulGoldCrates"
              value={form.amulGoldCrates}
              placeholder="Amul Gold Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
            <input
              type="number"
              name="amulBuffaloCrates"
              value={form.amulBuffaloCrates}
              placeholder="Amul Buffalo Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mt-4">Gokul Milk Products</h2>
            <input
              type="number"
              name="gokulCowCrates"
              value={form.gokulCowCrates}
              placeholder="Gokul Cow Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
            <input
              type="number"
              name="gokulBuffaloCrates"
              value={form.gokulBuffaloCrates}
              placeholder="Gokul Buffalo Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
            <input
              type="number"
              name="gokulFullCreamCrates"
              value={form.gokulFullCreamCrates}
              placeholder="Gokul Full Cream Crates"
              min="0"
              onChange={handleChange}
              className="w-full border px-3 py-2 my-2 rounded"
            />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mt-4">Mahananda</h2>
          <input
            type="number"
            name="mahanandaCrates"
            value={form.mahanandaCrates}
            placeholder="Mahananda Crates"
            min="0"
            onChange={handleChange}
            className="w-full border px-3 py-2 my-2 rounded"
          />
        </div>

        <button
          type="submit"
          className={`mt-4 w-full ${
            timeError || loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#5b8db7] hover:bg-[#45749a]"
          } text-white py-2 rounded`}
          disabled={timeError || loading}
        >
          {loading ? "Submitting..." : "Submit Order"}
        </button>
      </form>
    </div>
  );
};

export default OrderPage;
