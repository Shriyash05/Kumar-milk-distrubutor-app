export const submitOrders = async ({ cart, user, paymentProof, startDate }) => {
  if (!cart || !cart.length) throw new Error("Cart is empty");
  if (!paymentProof) throw new Error("Payment proof is required");

  const totalCartAmount = cart.reduce((sum, it) => sum + Number(it.totalAmount || 0), 0);
  const now = new Date().toISOString();

  // Prepare cart items with user & order info
  const preparedCart = cart.map((it) => ({
    productId: it.productId,
    productName: it.productName,
    quantity: it.quantity,
    unitType: it.unitType,
    unitPrice: it.unitPrice,
    totalAmount: it.totalAmount,
    packSize: it.packSize,
    totalPieces: it.totalPieces,
    customer: user._id || user.id,
    customerName: user.name,
    customerPhone: user.phone || "",
    deliveryAddress: user.address || "",
    paymentProof: String(paymentProof),
    orderDate: now,
    startDate,
    orderType: "daily",
    status: "pending_verification",
    paymentStatus: "paid_pending_verification",
    paymentMethod: "UPI/Google Pay",
    needsAdminVerification: true,
    registeredFrom: "mobile-app",
    createdAt: now,
    updatedAt: now,
  }));

  // Attempt multi-item POST
  try {
    const multiOrderPayload = {
      customer: user._id || user.id,
      totalAmount: totalCartAmount,
      startDate,
      orderType: "daily",
      status: "pending_verification",
      paymentStatus: "paid_pending_verification",
      paymentMethod: "UPI/Google Pay",
      paymentProof: String(paymentProof),
      items: preparedCart,
    };

    const resp = await simpleAuthService.makeRequestWithRetry("/customer/orders", {
      method: "POST",
      body: JSON.stringify(multiOrderPayload),
    }, 3);

    await notificationService.notifyAdminNewOrder({
      ...multiOrderPayload,
      id: `MULTI_${Date.now()}`,
      customerName: user.name,
      items: preparedCart
    });
    await notificationService.notifyAdminPaymentProof({
      ...multiOrderPayload,
      id: `MULTI_${Date.now()}`,
      customerName: user.name
    });

    return { success: true, type: "multi", created: resp };
  } catch (err) {
    console.warn("Multi-item order failed, falling back to per-item orders:", err);
  }

  // Fallback: per-item POSTs with orderGroupId
  const orderGroupId = `OG_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const createdOrders = [];

  for (const it of preparedCart) {
    const singleOrder = { ...it, orderGroupId };
    const singleResp = await simpleAuthService.makeRequestWithRetry("/customer/orders", {
      method: "POST",
      body: JSON.stringify(singleOrder),
    }, 3);

    createdOrders.push(singleResp?._id || singleResp?.insertedId || singleResp?.id || null);
  }

  try {
    const totalAmount = preparedCart.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
    await notificationService.notifyAdminNewOrder({
      id: orderGroupId,
      orderGroupId,
      createdIds: createdOrders,
      items: preparedCart,
      customer: user,
      customerName: user.name,
      totalAmount: totalAmount
    });
    await notificationService.notifyAdminPaymentProof({
      id: orderGroupId,
      orderGroupId,
      customer: user,
      customerName: user.name,
      totalAmount: totalAmount
    });
  } catch (nErr) {
    console.warn("Admin notification failed:", nErr);
  }

  return { success: true, type: "per-item", created: createdOrders, orderGroupId };
};
