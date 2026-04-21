import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onToggleSidebar={() => setSidebarOpen((p) => !p)} />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
