import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { FiClock, FiPlay, FiSave, FiCheckCircle, FiXCircle, FiInfo } from 'react-icons/fi';
import './AdminScheduler.css';

const PRESET_CRONS = [
  { label: 'Every day at 6 AM', value: '0 0 6 * * *' },
  { label: 'Every day at 9 AM', value: '0 0 9 * * *' },
  { label: 'Every day at 8 PM', value: '0 0 20 * * *' },
  { label: 'Every hour', value: '0 0 * * * *' },
  { label: 'Every 30 minutes', value: '0 */30 * * * *' },
  { label: 'Every Monday at 9 AM', value: '0 0 9 * * MON' },
  { label: 'Custom', value: '' },
];

const AdminScheduler = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cron, setCron] = useState('');
  const [preset, setPreset] = useState('');
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await api.get('/api/scheduler');
        setStatus(data); // data should have { scheduled: bool, cron: string } for example : { scheduled: true, cron: '0 0 6 * * *' }
        setCron(data.cron || ''); 
      } catch {
        toast.error('Failed to load scheduler status');
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handlePresetChange = (value) => {
    setPreset(value);
    if (value) setCron(value);
  };

  const handleUpdateCron = async () => {
    if (!cron.trim()) {
      toast.error('Cron expression is required');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/api/scheduler/cron', { cron: cron.trim() });
      setStatus(data);
      toast.success('Cron schedule updated');
    } catch (err) {
      toast.error(err.response?.data || 'Invalid cron expression');
    } finally {
      setSaving(false);
    }
  };

  const handleRunNow = async () => {
    setTriggering(true);
    try {
      await api.post('/api/scheduler/run');
      toast.success('Scheduler triggered! Emails are being sent.');
    } catch {
      toast.error('Failed to trigger scheduler');
    } finally {
      setTriggering(false);
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
    <div className="admin-scheduler">
      <div className="page-header">
        <h1>
          <FiClock style={{ verticalAlign: 'middle', marginRight: 8 }} />
          Notification Scheduler
        </h1>
        <p>Control when reminder emails are sent to all users</p>
      </div>

      {/* Current status */}
      <div className="card scheduler-status-card">
        <div className="scheduler-status-header">
          <h3>Current Status</h3>
          <span
            className={`scheduler-status-badge ${
              status?.scheduled ? 'scheduler-active' : 'scheduler-inactive'
            }`}
          >
            {status?.scheduled ? (
              <>
                <FiCheckCircle /> Active
              </>
            ) : (
              <>
                <FiXCircle /> Inactive
              </>
            )}
          </span>
        </div>
        <div className="scheduler-current-cron">
          <FiClock />
          <span>Current cron: <code>{status?.cron || 'Not set'}</code></span>
        </div>
      </div>

      {/* Update cron */}
      <div className="card scheduler-config-card">
        <h3>Update Schedule</h3>

        <div className="form-group">
          <label>Quick Presets</label>
          <select
            className="form-control"
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
          >
            <option value="">Select a preset…</option>
            {PRESET_CRONS.map((p) => (
              <option key={p.label} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Cron Expression (6-field Spring format)</label>
          <input
            className="form-control"
            placeholder="0 0 6 * * *"
            value={cron}
            onChange={(e) => {
              setCron(e.target.value);
              setPreset('');
            }}
          />
          <div className="cron-help">
            <FiInfo size={13} />
            <span>Format: second minute hour day-of-month month day-of-week</span>
          </div>
        </div>

        <div className="scheduler-actions">
          <button
            className="btn btn-primary"
            onClick={handleUpdateCron}
            disabled={saving}
          >
            <FiSave /> {saving ? 'Saving…' : 'Update Cron'}
          </button>
          <button
            className="btn btn-success"
            onClick={handleRunNow}
            disabled={triggering}
          >
            <FiPlay /> {triggering ? 'Running…' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* Reference table */}
      <div className="card scheduler-ref">
        <h3>Cron Expression Reference</h3>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Allowed Values</th>
                <th>Example</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Second</td><td>0-59</td><td>0</td></tr>
              <tr><td>Minute</td><td>0-59</td><td>30</td></tr>
              <tr><td>Hour</td><td>0-23</td><td>6</td></tr>
              <tr><td>Day of Month</td><td>1-31</td><td>*</td></tr>
              <tr><td>Month</td><td>1-12 or JAN-DEC</td><td>*</td></tr>
              <tr><td>Day of Week</td><td>0-7 or SUN-SAT</td><td>MON-FRI</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminScheduler;
