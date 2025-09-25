import React, { useEffect, useState } from "react";
import axios from "axios";

const InventoryManagement = () => {
  const [inventory, setInventory] = useState(null);
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0]; // yyyy-mm-dd
  });

  const defaultForm = {
    amulBuffaloCrates: 0,
    amulGoldCrates: 0,
    amulTaazaCrates: 0,
    gokulCowCrates: 0,
    gokulBuffaloCrates: 0,
    gokulFullCreamCrates: 0,
    mahanandaCrates: 0,
  };

  const [form, setForm] = useState(defaultForm);

  const fetchInventory = async () => {
    try {
      const res = await axios.get(`/api/inventory/${date}`);
      setInventory(res.data);

      const {
        amulBuffaloCrates,
        amulGoldCrates,
        amulTaazaCrates,
        gokulCowCrates,
        gokulBuffaloCrates,
        gokulFullCreamCrates,
        mahanandaCrates,
      } = res.data;

      setForm({
        amulBuffaloCrates,
        amulGoldCrates,
        amulTaazaCrates,
        gokulCowCrates,
        gokulBuffaloCrates,
        gokulFullCreamCrates,
        mahanandaCrates,
      });
    } catch (err) {
      console.error("Error fetching inventory:", err);
      setInventory(null);
      setForm(defaultForm);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (inventory) {
        await axios.put(
          `https://kumar-milk-distributors.onrender.com/api/inventory/${date}`,
          form
        );
      } else {
        await axios.post(
          `https://kumar-milk-distributors.onrender.com/api/inventory`,
          { ...form, date }
        );
      }
      alert("Inventory saved!");
      fetchInventory();
    } catch (err) {
      console.error("Failed to save inventory:", err);
      alert("Failed to save inventory.");
    }
  };
  const fetchLowStock = async () => {
    try {
      const res = await axios.get(
        `https://kumar-milk-distributors.onrender.com/api/inventory/warnings/${date}`
      );
      if (res.data.lowStock.length > 0) {
        const lowItems = res.data.lowStock
          .map(
            (item) => `${item.product.replace(/Crates$/, "")}: ${item.quantity}`
          )
          .join("\n");
        alert(`⚠️ Low Inventory Warning:\n\n${lowItems}`);
      }
    } catch (err) {
      console.error("Error fetching low stock warnings:", err);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchLowStock();
  }, [date]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: parseInt(e.target.value) || 0,
    });
  };

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Inventory Management</h2>

      <label className="block mb-2 font-medium">Select Date:</label>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="mb-6 border rounded px-3 py-2"
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        {Object.entries(form).map(([key, value]) => (
          <div key={key}>
            <label className="block capitalize mb-1">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/Crates$/, "")
                .trim()}
            </label>
            <input
              type="number"
              min="0"
              name={key}
              value={value}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded ${
                value < 10 ? "border-red-500" : ""
              }`}
            />
            {value < 10 && (
              <p className="text-sm text-red-500">Low stock warning</p>
            )}
          </div>
        ))}

        <div className="col-span-2 mt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Inventory
          </button>
        </div>
      </form>
    </div>
  );
};

export default InventoryManagement;
