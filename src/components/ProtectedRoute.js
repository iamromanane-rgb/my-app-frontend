import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Spinner shown while the auth session is being restored */
const FullPageLoader = () => (
  <div style={{
    height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'var(--color-bg)'
  }}>
    <div className="spinner" />
  </div>
);

/**
 * Wraps routes that require authentication.
 * @param {boolean} adminOnly – If true, only admin users can access the route.
 */
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <FullPageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
