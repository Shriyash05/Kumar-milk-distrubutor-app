const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const generateInvoice = (order, stream) => {
  const doc = new PDFDocument({ margin: 50 });

  doc.pipe(stream);

  // ✅ Add Logo
  const logoPath = path.join(__dirname, "../assets/logo.png");
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 45, { width: 100 });
  }

  // Header
  doc
    .fontSize(20)
    .text("Kumar Milk Distributors", 200, 50, { align: "right" })
    .fontSize(10)
    .text("Invoice Date: " + new Date().toLocaleDateString(), {
      align: "right",
    })
    .moveDown(2);

  // Invoice Info
  doc
    .fontSize(12)
    .text(`Invoice For Order ID: ${order._id}`)
    .text(`Shop Name: ${order.shopName}`)
    .text(`Address: ${order.address}`)
    .text(`Delivery Date: ${new Date(order.deliveryDate).toLocaleDateString()}`)
    .moveDown(1);

  // Table Header
  doc
    .fontSize(12)
    .fillColor("#4f83cc")
    .text("Product", 50, doc.y, { width: 200 })
    .text("Crates", 300, doc.y)
    .moveDown(0.5)
    .fillColor("black");

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  // Crate data
  const crates = {
    amulTaazaCrates: "Amul Taaza",
    amulGoldCrates: "Amul Gold",
    amulBuffaloCrates: "Amul Buffalo",
    gokulCowCrates: "Gokul Cow",
    gokulBuffaloCrates: "Gokul Buffalo",
    gokulFullCreamCrates: "Gokul Full Cream",
    mahanandaCrates: "Mahananda",
  };

  for (const [key, label] of Object.entries(crates)) {
    if (order[key] > 0) {
      doc
        .fontSize(12)
        .text(label, 50, doc.y + 5, { width: 200 })
        .text(order[key].toString(), 300, doc.y + 5);
    }
  }

  doc.moveDown(2);

  // Totals
  doc
    .fontSize(12)
    .text(`Total Amount: ₹${order.totalAmount}`, { align: "right" })
    .text(`Payment Method: ${order.paymentMethod}`, { align: "right" })
    .text(`Payment Status: ${order.paymentStatus}`, { align: "right" })
    .text(`Order Status: ${order.status}`, { align: "right" });

  doc.end();
};

module.exports = generateInvoice;
