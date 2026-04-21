import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import {
  FiUsers,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
} from 'react-icons/fi';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchType, setSearchType] = useState('name'); // name | email | empid
  const [searchValue, setSearchValue] = useState('');
  const [editModal, setEditModal] = useState(null); // user obj or null
  const [editForm, setEditForm] = useState({
    email: '',
    username: '',
    empId: '',
    accessLevel: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const { data } = await api.get('/api/users');
      setUsers(Array.isArray(data) ? data : []); // Ensure data is an array
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
        data = res.data ? [res.data] : []; // array for consistency, even if single result
      } else if (searchType === 'empid') {
        const res = await api.get(`/api/admin/users/search/empid?empId=${encodeURIComponent(searchValue)}`);
        data = res.data ? [res.data] : []; // empty [] means not found, vs null/undefined which means error
      } else {
        const res = await api.get(`/api/users/search/name?name=${encodeURIComponent(searchValue)}`);
        data = res.data; // no array wrapping needed, this endpoint returns an array of matches
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

  /* Edit modal */
  const openEdit = (u) => {
    setEditModal(u);
    setEditForm({
      email: u.email || '',
      username: u.username || '',
      empId: u.empId || '',
      accessLevel: u.accessLevel === 'READ_WRITE' ? 'read_write' : 'read',
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/admin/users/empid/${editModal.empId}`, {
        email: editForm.email,
        username: editForm.username,
        empId: Number(editForm.empId),
        accessLevel: editForm.accessLevel,
      });
      toast.success('User updated');
      setEditModal(null);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  /* Delete */
  const handleDelete = async (empId) => {
    if (!window.confirm(`Delete user with Emp ID ${empId}?`)) return;
    try {
      await api.delete(`/api/admin/users/empid/${empId}`);
      toast.success('User deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="admin-users">
      <div className="page-header">
        <h1>
          <FiUsers style={{ verticalAlign: 'middle', marginRight: 8 }} />
          User Management
        </h1>
        <p>Search, edit, and manage all registered users</p>
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
                <th>Access</th>
                <th>Created</th>
                <th style={{ width: 100 }}>Actions</th>
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
                    <span
                      className={`badge ${
                        u.accessLevel === 'READ_WRITE' ? 'badge-readwrite' : 'badge-read'
                      }`}
                    >
                      {u.accessLevel === 'READ_WRITE' ? 'Read/Write' : 'Read'}
                    </span>
                  </td>
                  <td>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-icon" title="Edit" onClick={() => openEdit(u)}>
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        title="Delete"
                        style={{ color: 'var(--color-danger)' }}
                        onClick={() => handleDelete(u.empId)}
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}> 
            <h2>Edit User (Emp #{editModal.empId})</h2>
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-control"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  className="form-control"
                  type="number"
                  value={editForm.empId}
                  onChange={(e) => setEditForm({ ...editForm, empId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Access Level</label>
                <select
                  className="form-control"
                  value={editForm.accessLevel}
                  onChange={(e) => setEditForm({ ...editForm, accessLevel: e.target.value })}
                >
                  <option value="read">Read</option>
                  <option value="read_write">Read / Write</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <FiSave /> {saving ? 'Saving…' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
