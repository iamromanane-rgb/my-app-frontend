import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiHome,
  FiCalendar,
  FiUser,
  FiUsers,
  FiClock,
  FiMail,
  FiShield,
  FiX,
} from 'react-icons/fi';
import './Sidebar.css';

const navItems = [ //list of navigation items for the sidebar, each with a route, label, and icon. These will be rendered as links in the sidebar, allowing users to navigate to different parts of the application.
  { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
  { to: '/events', label: 'My Events', icon: <FiCalendar /> },
  { to: '/profile', label: 'Profile', icon: <FiUser /> },
];

const adminItems = [
  { to: '/admin/users', label: 'User Management', icon: <FiUsers /> },
  { to: '/admin/promotion', label: 'Admin Management', icon: <FiShield /> },
  { to: '/admin/scheduler', label: 'Scheduler', icon: <FiClock /> },
  { to: '/admin/broadcast', label: 'Broadcast Email', icon: <FiMail /> },
];

const Sidebar = ({ open, onClose }) => {
  const { isAdmin } = useAuth();
  const location = useLocation(); 

  return (
    <>
      {/* Backdrop for mobile */}
      {open && <div className="sidebar-backdrop" onClick={onClose} />} 

      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-logo">🔔 XUMO-Reminder</span>
          <button className="sidebar-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                  }
                  onClick={onClose}
                >
                  <span className="sidebar-link-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <> 
              <div className="sidebar-section">
                <FiShield size={14} />
                <span>Admin</span>
              </div>
              <ul>
                {adminItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <span className="sidebar-link-icon">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
