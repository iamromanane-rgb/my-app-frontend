import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiX } from 'react-icons/fi';
import './MyEvents.css';

const MyEvents = () => {
  const { user, canWrite } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, event obj = edit
  const [form, setForm] = useState({ eventType: '', eventDate: '', description: '' });
  const [saving, setSaving] = useState(false);

  const userId = user?.userId;

  const fetchEvents = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await api.get(`/api/users/${userId}/events`);
      setEvents(data);
    } catch (err) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* Search */
  const handleSearch = async () => {
    if (!search.trim()) {
      fetchEvents();
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get( `/api/users/${userId}/events/search?keyword=${encodeURIComponent(search)}`); //encodeURIComponent is used to safely encode the search keyword, handling spaces and special characters properly in the URL.
      setEvents(data);
    } catch {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  /* Open modal */
  const openCreate = () => {
    setEditing(null);
    setForm({ eventType: '', eventDate: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (event) => {
    setEditing(event);
    setForm({
      eventType: event.eventType || '',
      eventDate: event.eventDate || '',
      description: event.description || '',
    });
    setModalOpen(true);
  };

  /* Save (create / update) */
  const handleSave = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior, which would cause a page reload. We want to handle the submission with our own logic instead.
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/users/${userId}/events/${editing.id}`, form);
        toast.success('Event updated');
      } else {
        await api.post(`/api/users/${userId}/events`, form);
        toast.success('Event created');
      }
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      toast.error(err.response?.data || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* Delete */
  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await api.delete(`/api/users/${userId}/events/${eventId}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="my-events">
      <div className="flex-between page-header">
        <div>
          <h1>
            <FiCalendar style={{ verticalAlign: 'middle', marginRight: 8 }} />
            My Events
          </h1>
          <p>
            {canWrite
              ? 'Manage your celebrations and milestones'
              : 'View your celebrations (read-only access)'}
          </p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={openCreate}>
            <FiPlus /> Add Event
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="events-search card">
        <FiSearch className="events-search-icon" />
        <input
          className="form-control events-search-input"
          placeholder="Search events by description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-secondary btn-sm" onClick={handleSearch}>
          Search
        </button>
        {search && (
          <button
            className="btn btn-icon btn-sm"
            onClick={() => {
              setSearch('');
              fetchEvents();
            }}
          >
            <FiX />
          </button>
        )}
      </div>

      {/* Events table */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">📅</div>
          <p>No events found</p>
          {canWrite && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openCreate}>
              <FiPlus /> Create your first event
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Date</th>
                <th>Description</th>
                {canWrite && <th style={{ width: 100 }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const t = (event.eventType || '').toLowerCase();
                const badgeCls = t.includes('birthday')
                  ? 'badge-birthday'
                  : t.includes('anniversary')
                  ? 'badge-anniversary'
                  : 'badge-other';
                return (
                  <tr key={event.id}>
                    <td>
                      <span className={`badge ${badgeCls}`}>{event.eventType}</span>
                    </td>
                    <td>{event.eventDate}</td>
                    <td>{event.description || '—'}</td>
                    {canWrite && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-icon"
                            title="Edit"
                            onClick={() => openEdit(event)}
                          >
                            <FiEdit2 size={15} />
                          </button>
                          <button
                            className="btn-icon"
                            title="Delete"
                            style={{ color: 'var(--color-danger)' }}
                            onClick={() => handleDelete(event.id)}
                          >
                            <FiTrash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editing ? 'Edit Event' : 'New Event'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Event Type</label>
                <select
                  className="form-control"
                  value={form.eventType}
                  onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                  required
                >
                  <option value="">Select type…</option>
                  <option value="Birthday">Birthday</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date</label>
                <input
                  className="form-control"
                  type="date"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  className="form-control"
                  placeholder="e.g. John's 30th Birthday"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEvents;
