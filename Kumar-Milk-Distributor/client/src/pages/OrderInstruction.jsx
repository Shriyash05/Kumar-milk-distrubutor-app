import React from "react";

import { useNavigate } from "react-router-dom";

const OrderInstructions = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen flex flex-col items-center justify-center p-6 ">
      <div className="max-w-3xl bg-[#ededed] shadow-lg rounded-2xl p-8 text-center border-[#83a4c8] border-[10px]">
        <h1 className="text-3xl font-bold text-[#6c4836] mb-4">How to Order</h1>
        <p className="text-gray-700 text-lg">
          Place your order directly on our website. Orders must be placed one
          day before delivery.
        </p>

        <div className="mt-6 bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6c4836]">
          <h2 className="text-2xl font-semibold text-[#6c4836]">
            Order Timing
          </h2>
          <p className="text-gray-600 mt-1 font-medium">
            Before <span className="text-[#d7382e]">1 PM</span>
          </p>
        </div>

        <div className="mt-6 bg-white p-4 rounded-lg shadow-md border-l-4 border-[#6c4836]">
          <h2 className="text-2xl font-semibold text-[#6c4836]">
            Delivery Timing
          </h2>
          <p className="text-gray-600 mt-1 font-medium">
            Between <span className="text-[#d7382e]">4 AM - 7 AM</span>
          </p>
        </div>

        <button
          className="mt-8 bg-[#54a9f7] hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl shadow-md text-lg"
          onClick={() => navigate("/login")}
        >
          Order Now
        </button>
      </div>
    </div>
  );
};

export default OrderInstructions;
