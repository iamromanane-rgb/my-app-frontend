import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  FiShield,
  FiSearch,
  FiX,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import './AdminPromotion.css';

const AdminPromotion = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState('name'); // name | email | empid
  const [searchValue, setSearchValue] = useState('');
  const [promoting, setPromoting] = useState(null); // empId of user being promoted/demoted

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* Search */
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      fetchAll();
      return;
    }
    setLoading(true);
    try {
      let data;
      if (searchType === 'email') {
        const res = await api.get(`/api/users/search/email?email=${encodeURIComponent(searchValue)}`);
        data = res.data ? [res.data] : [];
      } else if (searchType === 'empid') {
        const res = await api.get(`/api/admin/users/search/empid?empId=${encodeURIComponent(searchValue)}`);
        data = res.data ? [res.data] : [];
      } else {
        const res = await api.get(`/api/users/search/name?name=${encodeURIComponent(searchValue)}`);
        data = res.data;
      }
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.response?.status === 404) {
        setUsers([]);
      } else {
        toast.error('Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  /* Promote user to admin */
  const handlePromote = async (empId) => {
    setPromoting(empId);
    try {
      await api.put(`/api/admin/users/empid/${empId}/promote`);
      toast.success('User promoted to admin');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data || 'Promotion failed');
    } finally {
      setPromoting(null);
    }
  };

  /* Demote user from admin */
  const handleDemote = async (empId) => {
    if (!window.confirm('Remove admin access from this user?')) return;
    
    setPromoting(empId);
    try {
      await api.put(`/api/admin/users/empid/${empId}/demote`);
      toast.success('User removed from admin');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data || 'Demotion failed');
    } finally {
      setPromoting(null);
    }
  };

  return (
    <div className="admin-promotion">
      <div className="page-header">
        <h1>
          <FiShield style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Admin Management
        </h1>
        <p>Promote and demote users to/from admin role</p>
      </div>

      {/* Search */}
      <div className="card admin-search">
        <select
          className="form-control admin-search-type"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="name">By Name</option>
          <option value="email">By Email</option>
          <option value="empid">By Emp ID</option>
        </select>
        <div className="admin-search-bar">
          <FiSearch className="admin-search-icon" />
          <input
            className="form-control"
            placeholder={`Search by ${searchType}…`}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleSearch}>
          Search
        </button>
        {searchValue && (
          <button
            className="btn btn-icon btn-sm"
            onClick={() => {
              setSearchValue('');
              fetchAll();
            }}
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Users table */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">👥</div>
          <p>No users found</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Emp ID</th>
                <th>Current Role</th>
                <th>Access</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.empId}</td>
                  <td>
                    <span className={`badge ${u.isAdmin ? 'badge-admin' : 'badge-user'}`}>
                      {u.isAdmin ? 'Admin' : 'Regular User'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.accessLevel === 'READ_WRITE' ? 'badge-readwrite' : 'badge-read'
                      }`}
                    >
                      {u.accessLevel === 'READ_WRITE' ? 'Read/Write' : 'Read'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {!u.isAdmin ? (
                        <button
                          className="btn-icon btn-promote"
                          title="Promote to Admin"
                          onClick={() => handlePromote(u.empId)}
                          disabled={promoting === u.empId}
                        >
                          {promoting === u.empId ? '...' : <FiArrowUp size={15} />}
                        </button>
                      ) : (
                        <button
                          className="btn-icon btn-demote"
                          title="Remove from Admin"
                          onClick={() => handleDemote(u.empId)}
                          disabled={promoting === u.empId}
                        >
                          {promoting === u.empId ? '...' : <FiArrowDown size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="card promotion-legend">
        <h4>Legend</h4>
        <div className="legend-items">
          <div className="legend-item">
            <span className="badge badge-admin">Admin</span>
            <span>User has admin access to management features</span>
          </div>
          <div className="legend-item">
            <span className="badge badge-user">Regular User</span>
            <span>User can only view their own events</span>
          </div>
          <div className="legend-item">
            <FiArrowUp className="legend-icon promote" />
            <span>Click to promote user to admin</span>
          </div>
          <div className="legend-item">
            <FiArrowDown className="legend-icon demote" />
            <span>Click to remove admin access</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPromotion;
