const cron = require("node-cron");
const Order = require("../models/Order");

const updateOrderStatuses = () => {
  cron.schedule("*/30 * * * *", async () => {
    const now = new Date();

    try {
      const todayOrders = await Order.find({
        deliveryDate: {
          $lte: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            23,
            59,
            59
          ),
          $gte: new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            0,
            0,
            0
          ),
        },
      });

      for (const order of todayOrders) {
        const [hour, minute] = order.deliveryTime.split(":").map(Number);
        const deliveryDateTime = new Date(order.deliveryDate);
        deliveryDateTime.setHours(hour);
        deliveryDateTime.setMinutes(minute);
        deliveryDateTime.setSeconds(0);

        const timeDiff = deliveryDateTime - now;
        const minsLeft = Math.floor(timeDiff / 60000); // in minutes

        if (minsLeft > 120) {
          // >2hr left → still Pending
          continue;
        } else if (
          minsLeft <= 120 &&
          minsLeft > 60 &&
          order.status === "Pending"
        ) {
          order.status = "Ready for Pickup";
        } else if (
          minsLeft <= 60 &&
          minsLeft > 0 &&
          order.status === "Ready for Pickup"
        ) {
          order.status = "Out for Delivery";
        } else if (minsLeft <= 0 && order.status === "Out for Delivery") {
          order.status = "Delivered";
        }

        await order.save();
      }

      console.log("⏰ Order status auto-updated!");
    } catch (err) {
      console.error("🚨 Order status update error:", err);
    }
  });
};

module.exports = updateOrderStatuses;
