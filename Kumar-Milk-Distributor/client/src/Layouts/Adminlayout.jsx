import { Outlet } from "react-router-dom";
import { useState } from "react";
import AdminSidebar from "../Components/AdminSidebar";
import Topbar from "../Components/Topbar";

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--neutral-gray-50)' }}>
      <Topbar title="Admin Console" onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 md:ml-0">
          <div className="container max-w-none py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
