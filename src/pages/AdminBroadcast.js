import { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiMail, FiSend, FiAlertTriangle } from 'react-icons/fi';
import './AdminBroadcast.css';

const AdminBroadcast = () => {
  const [form, setForm] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [confirm, setConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setConfirm(true);
  };

  const handleSend = async () => {
    setConfirm(false);
    setSending(true);
    try {
      const { data } = await api.post('/api/admin/notifications/broadcast-email', {
        subject: form.subject.trim(),
        message: form.message.trim(),
      });
      setResult(data);
      toast.success(`Email sent to ${data.sentCount} recipients`);
      setForm({ subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data || 'Broadcast failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-broadcast">
      <div className="page-header">
        <h1>
          <FiMail style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Broadcast Email
        </h1>
        <p>Send an email to all registered users at once</p>
      </div>

      <div className="card broadcast-card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject</label>
            <input
              className="form-control"
              placeholder="Important announcement…"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
              maxLength={200}
            />
            <span className="char-count">{form.subject.length}/200</span>
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              className="form-control"
              placeholder="Write your message here…"
              rows={8}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
              maxLength={5000}
            />
            <span className="char-count">{form.message.length}/5000</span>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !form.subject.trim() || !form.message.trim()}
          >
            <FiSend /> {sending ? 'Sending…' : 'Send Broadcast'}
          </button>
        </form>
      </div>

      {/* Result card */}
      {result && (
        <div className="card broadcast-result">
          <h3>Broadcast Result</h3>
          <div className="broadcast-result-grid">
            <div className="broadcast-stat">
              <span className="broadcast-stat-value">{result.totalRecipients}</span>
              <span className="broadcast-stat-label">Total Recipients</span>
            </div>
            <div className="broadcast-stat broadcast-stat--success">
              <span className="broadcast-stat-value">{result.sentCount}</span>
              <span className="broadcast-stat-label">Sent</span>
            </div>
            <div className="broadcast-stat broadcast-stat--danger">
              <span className="broadcast-stat-value">{result.failedCount}</span>
              <span className="broadcast-stat-label">Failed</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="broadcast-confirm-icon">
              <FiAlertTriangle size={32} />
            </div>
            <h2>Confirm Broadcast</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              This will send an email to <strong>all registered users</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Subject: <strong>{form.subject}</strong>
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setConfirm(false)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleSend}>
                <FiSend /> Send to All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBroadcast;
