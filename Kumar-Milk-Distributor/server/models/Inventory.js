const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true,
  },
  amulBuffaloCrates: Number,
  amulGoldCrates: Number,
  amulTaazaCrates: Number,
  gokulCowCrates: Number,
  gokulBuffaloCrates: Number,
  gokulFullCreamCrates: Number,
  mahanandaCrates: Number,
});

module.exports = mongoose.model("Inventory", inventorySchema);
