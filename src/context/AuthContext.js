import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => { //functional component that provides authentication context to its children components. It manages user authentication state, including login, registration, and logout functionality, as well as checking for admin status and restoring sessions from localStorage.
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /* Probe an admin-only endpoint to determine admin status */
  const checkAdminStatus = useCallback(async () => {
    try {
      await api.get('/api/scheduler');
      setIsAdmin(true);
      return true;
    } catch {
      setIsAdmin(false);
      return false;
    }
  }, []);

  /* Restore session from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('user');
    if (token && raw) {
      try {
        const parsed = JSON.parse(raw); //user object comes as string, parse it back to object
        setUser(parsed);
        checkAdminStatus().finally(() => setLoading(false));
      } catch {
        localStorage.clear();
        setLoading(false); 
      }
    } else {
      setLoading(false);
    }
  }, [checkAdminStatus]);

  const login = async (email, password) => {
    const { data } = await api.post('/api/users/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data));
    setUser(data);
    await checkAdminStatus();
    return data;
  };

  const register = async (email, username, password, empId) => {
    const { data } = await api.post('/api/users', { email, username, password, empId });
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAdmin(false);
  };

  /** Convenience booleans */
  const canWrite = user?.accessLevel === 'read_write'; //const and not boolean function because we only need to check this once when user state changes, not on every render

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, loading, canWrite, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
