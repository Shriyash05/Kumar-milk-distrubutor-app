import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react"; // Optional icons, install `lucide-react` or use any icon library

const Sidebar = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();

  const links = [
    { name: "Dashboard", to: "/customer-dashboard" },
    { name: "Place Order", to: "/customer-dashboard/place-order" },
    { name: "Ongoing Orders", to: "/customer-dashboard/ongoing" },
    { name: "Order History", to: "/customer-dashboard/history" },
    { name: "Logout", to: "/logout" },
  ];

  return (
    <>
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex flex-col h-screen w-64 bg-[#d7382e] text-white p-5 space-y-6">
        <h1 className="text-2xl font-bold mb-6">MilkMate</h1>
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.to}
            className={`block py-2 px-4 rounded-md hover:bg-white hover:text-[#d7382e] transition ${
              location.pathname === link.to ? "bg-white text-[#d7382e]" : ""
            }`}
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Sidebar Toggle (Mobile) */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setOpen(!open)}
          className="bg-[#d7382e] text-white p-2 rounded-md"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar (Mobile) */}
      {open && (
        <div className="md:hidden fixed top-0 left-0 w-64 h-full bg-[#d7382e] text-white p-5 z-40 shadow-lg">
          <h1 className="text-2xl font-bold mb-6">MilkMate</h1>
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`block py-2 px-4 rounded-md hover:bg-white hover:text-[#d7382e] transition ${
                location.pathname === link.to ? "bg-white text-[#d7382e]" : ""
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default Sidebar;
