const Inventory = require("../models/Inventory");

const createInventory = async (req, res) => {
  try {
    const { date, ...crates } = req.body;
    const inventoryDate = new Date(date);
    inventoryDate.setHours(0, 0, 0, 0); // Normalize to start of day

    const existing = await Inventory.findOne({ date: inventoryDate });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Inventory already exists for this date" });
    }

    const newInventory = new Inventory({
      date: inventoryDate,
      ...crates,
    });

    await newInventory.save();
    res
      .status(201)
      .json({ message: "Inventory created", inventory: newInventory });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create inventory", error: error.message });
  }
};

// Get inventory by date (use in admin panel and order check)
const getInventoryByDate = async (req, res) => {
  try {
    console.log("📅 Request received for:", req.params.date);
    const requestedDate = new Date(req.params.date);
    requestedDate.setHours(0, 0, 0, 0);
    console.log("🔍 Normalized date:", requestedDate);

    const inventory = await Inventory.findOne({ date: requestedDate });
    console.log("📦 Found inventory:", inventory);

    if (!inventory) {
      return res
        .status(404)
        .json({ message: "Inventory not found for this date" });
    }

    res.status(200).json(inventory);
  } catch (error) {
    console.error("❌ Error in getInventoryByDate:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch inventory", error: error.message });
  }
};

// Update inventory by date
const updateInventoryByDate = async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    targetDate.setHours(0, 0, 0, 0);

    const updated = await Inventory.findOneAndUpdate(
      { date: targetDate },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ message: "Inventory not found for this date" });
    }

    res.status(200).json({ message: "Inventory updated", inventory: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update inventory", error: error.message });
  }
};
// inventoryController.js
const getLowInventoryItems = async (req, res) => {
  const date = new Date(req.params.date);
  date.setHours(0, 0, 0, 0);
  const inventory = await Inventory.findOne({ date });
  if (!inventory)
    return res.status(404).json({ message: "Inventory not found" });

  const lowItems = Object.entries(inventory.toObject()).filter(
    ([key, val]) => key !== "_id" && key !== "date" && val < 50
  );

  res.status(200).json({ lowStock: lowItems });
};

module.exports = {
  createInventory,
  getInventoryByDate,
  updateInventoryByDate,
  getLowInventoryItems,
};
