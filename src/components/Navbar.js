import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiLogOut, FiShield, FiMoon, FiSun } from 'react-icons/fi';
import './Navbar.css';

const Navbar = ({ onToggleSidebar }) => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const accessLabel =
    user?.accessLevel === 'read_write' ? 'Read / Write' : 'Read Only'; 

  return (
    <header className="navbar">
      <button className="navbar-menu-btn" onClick={onToggleSidebar}>
        <FiMenu />
      </button>

      <div className="navbar-spacer" />

      <div className="navbar-user">
        {isAdmin && (
          <span className="badge badge-admin">
            <FiShield size={12} style={{ marginRight: 4 }} />
            Admin
          </span>
        )}
        <span className={`badge ${user?.accessLevel === 'read_write' ? 'badge-readwrite' : 'badge-read'}`}>
          {accessLabel}
        </span>
        <div className="navbar-avatar">{user?.username?.[0]?.toUpperCase() || '?'}</div>
        <div className="navbar-user-info">
          <span className="navbar-username">{user?.username}</span>
          <span className="navbar-email">{user?.email}</span>
        </div>
        <button
          className="navbar-theme-btn"
          onClick={toggleTheme}
          title={isDark ? 'Light mode' : 'Dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        <button className="navbar-logout" onClick={handleLogout} title="Logout">
          <FiLogOut />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
