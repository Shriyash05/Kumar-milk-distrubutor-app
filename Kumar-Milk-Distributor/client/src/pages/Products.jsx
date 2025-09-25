import React from "react";

const MilkPrices = () => {
  const milkProducts = [
    {
      brand: "Amul Milk Products",
      items: [
        { name: "Amul Taaza 500ml (24 pack)", price: "₹633.24" },
        { name: "Amul Taaza 1L (12 pack)", price: "₹620.64" },
        { name: "Amul Buffalo Milk 500ml (24 pack)", price: "₹812.40" },
        { name: "Amul Cow Milk 500ml (24 pack)", price: "₹627.00" },
        { name: "Amul T-Special 500ml (24 pack)", price: "₹633.24" },
      ],
    },
    {
      brand: "Gokul Milk Products",
      items: [
        { name: "Full Cream Milk 1L Pouch", price: "₹72.00" },
        { name: "Buffalo Milk 500ml Pouch", price: "₹36.00" },
        { name: "Cow Milk Satvik 500ml", price: "₹36.00" },
      ],
    },
    {
      brand: "Mahanand Milk Products",
      items: [
        { name: "Annapurna Toned Milk 1L", price: "₹56.00" },
        { name: "Toned Milk 1L", price: "₹55.00" },
        { name: "Cow Milk 1L", price: "₹57.00" },
      ],
    },
  ];

  return (
    <div className="bg-[#fff] min-h-screen flex flex-col items-center py-10 px-4">
      <h1 className="text-4xl font-bold text-[#6c4836] mb-8">Milk Prices</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {milkProducts.map((category, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-xl p-6 border-t-4 border-[#83a4c8]"
          >
            <h2 className="text-2xl font-semibold text-[#6c4836] border-b-2 border-[#83a4c8] pb-2 mb-4">
              {category.brand}
            </h2>
            <ul className="space-y-3">
              {category.items.map((item, i) => (
                <li
                  key={i}
                  className="flex justify-between bg-[#fdfdfd] p-3 rounded-lg shadow-sm border-l-4 border-[#6c4836]"
                >
                  <span className="text-gray-800 font-medium">{item.name}</span>
                  <span className="text-[#d7382e] font-semibold">
                    {item.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MilkPrices;
