import React from "react";

const Topbar = ({ title = "Kumar Milk Distributors", onMenuClick }) => {
  return (
    <header
      className="w-full sticky top-0 z-40"
      style={{ backgroundColor: 'var(--neutral-white)', boxShadow: 'var(--shadow-sm)', borderBottom: '1px solid var(--neutral-gray-200)' }}
    >
      <div className="container flex-between py-3">
        <div className="flex items-center gap-3">
          <button
            aria-label="Open menu"
            className="md:hidden btn btn-secondary px-3 py-2"
            onClick={onMenuClick}
          >
            ☰
          </button>
          <h1 className="heading-4 mb-0" style={{ color: 'var(--neutral-gray-900)' }}>
            {title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-small text-muted hidden sm:inline">Professional Milk Distribution</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;


