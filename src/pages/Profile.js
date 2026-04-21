import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiHash, FiShield, FiSave } from 'react-icons/fi';
import './Profile.css';

const Profile = () => {
  const { user, canWrite } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', email: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get(`/api/users/${user.userId}`);
        setProfile(data);
        setForm({ username: data.username, email: data.email });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetch();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put(`/api/users/${user.userId}`, form);
      setProfile(data);
      setEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>
          <FiUser style={{ verticalAlign: 'middle', marginRight: 8 }} />
          My Profile
        </h1>
        <p>View and manage your account information</p>
      </div>

      <div className="card profile-card">
        <div className="profile-avatar">
          {profile?.username?.[0]?.toUpperCase() || '?'}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                className="form-control"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                className="form-control"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="profile-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setForm({ username: profile.username, email: profile.email });
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <FiSave /> {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="profile-field">
              <FiUser className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Username</span>
                <span className="profile-field-value">{profile?.username}</span>
              </div>
            </div>
            <div className="profile-field">
              <FiMail className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Email</span>
                <span className="profile-field-value">{profile?.email}</span>
              </div>
            </div>
            <div className="profile-field">
              <FiHash className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Employee ID</span>
                <span className="profile-field-value">{profile?.empId}</span>
              </div>
            </div>
            <div className="profile-field">
              <FiShield className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Access Level</span>
                <span className="profile-field-value">
                  <span
                    className={`badge ${
                      profile?.accessLevel === 'READ_WRITE' ? 'badge-readwrite' : 'badge-read'
                    }`}
                  >
                    {profile?.accessLevel === 'READ_WRITE' ? 'Read / Write' : 'Read Only'}
                  </span>
                </span>
              </div>
            </div>
            <div className="profile-field">
              <FiHash className="profile-field-icon" />
              <div>
                <span className="profile-field-label">Member Since</span>
                <span className="profile-field-value">
                  {profile?.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString()
                    : '—'}
                </span>
              </div>
            </div>

            {canWrite && (
              <div className="profile-actions">
                <button className="btn btn-primary" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
