import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyEvents from './pages/MyEvents';
import Profile from './pages/Profile';
import AdminUsers from './pages/AdminUsers';
import AdminScheduler from './pages/AdminScheduler';
import AdminBroadcast from './pages/AdminBroadcast';
import AdminPromotion from './pages/AdminPromotion';
import './App.css';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated routes inside the layout shell */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/events" element={<MyEvents />} />
        <Route path="/profile" element={<Profile />} />

        {/* Admin-only routes */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute adminOnly>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/scheduler"
          element={
            <ProtectedRoute adminOnly>
              <AdminScheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/broadcast"
          element={
            <ProtectedRoute adminOnly>
              <AdminBroadcast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/promotion"
          element={
            <ProtectedRoute adminOnly>
              <AdminPromotion />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} /> 
    </Routes>
  );
}

export default App;
