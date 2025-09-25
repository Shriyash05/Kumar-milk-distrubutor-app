import { NavLink, useNavigate } from "react-router-dom";
import logo from "../assets/kumar-logo.svg";

const AdminSidebar = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { to: "/admin-dashboard/home", label: "Dashboard", icon: "📊" },
    { to: "/admin-dashboard/orders", label: "Orders", icon: "📋" },
    { to: "/admin-dashboard/stocks", label: "Inventory", icon: "📦" },
  ];

  return (
    <aside 
      className={`fixed md:static inset-y-0 left-0 transform md:transform-none transition-transform duration-200 ease-in-out w-72 md:w-64 h-screen flex flex-col border-r z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      style={{ 
        backgroundColor: 'var(--neutral-white)',
        borderColor: 'var(--neutral-gray-200)'
      }}
    >
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'var(--neutral-gray-200)' }}>
        <div className="flex items-center space-x-3">
          <img src={logo} alt="Kumar Milk Distributors" className="h-8 w-auto" />
          <div>
            <h2 className="heading-4 mb-0" style={{ color: 'var(--neutral-gray-900)' }}>
              Admin Panel
            </h2>
            <p className="text-xs text-muted">Kumar Milk Distributors</p>
          </div>
        </div>
        <button
          className="md:hidden btn btn-secondary px-3 py-2"
          onClick={onClose}
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6">
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm ${
                  isActive
                    ? 'text-white shadow-md'
                    : 'hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => ({
                backgroundColor: isActive ? 'var(--accent-blue)' : 'transparent',
                color: isActive ? 'var(--neutral-white)' : 'var(--neutral-gray-700)',
              })}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-6 border-t" style={{ borderColor: 'var(--neutral-gray-200)' }}>
        <div className="mb-4">
          <div className="text-sm font-medium" style={{ color: 'var(--neutral-gray-900)' }}>
            Admin User
          </div>
          <div className="text-xs text-muted">System Administrator</div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-secondary w-full py-2 text-sm"
          style={{
            backgroundColor: 'var(--neutral-gray-100)',
            borderColor: 'var(--neutral-gray-300)',
            color: 'var(--neutral-gray-700)'
          }}
        >
          <span className="mr-2">🔓</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
