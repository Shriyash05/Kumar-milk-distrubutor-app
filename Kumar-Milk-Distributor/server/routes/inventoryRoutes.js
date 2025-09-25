const express = require("express");
const {
  createInventory,
  getInventoryByDate,
  updateInventoryByDate,
  getLowInventoryItems,
} = require("../controllers/inventoryController.js");

const router = express.Router();

router.post("/", createInventory);
router.get("/warnings/:date", getLowInventoryItems);
router.get("/:date", getInventoryByDate);
router.put("/:date", updateInventoryByDate);

module.exports = router;
