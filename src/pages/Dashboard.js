import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiGift, FiAward, FiStar, FiCalendar } from 'react-icons/fi';
import './Dashboard.css';

const eventIcon = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('birthday')) return <FiGift />;
  if (t.includes('anniversary')) return <FiAward />;
  return <FiStar />;
};

const eventBadge = (type) => {
  const t = (type || '').toLowerCase();
  if (t.includes('birthday')) return 'badge-birthday';
  if (t.includes('anniversary')) return 'badge-anniversary';
  return 'badge-other';
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');// T00:00:00 means we want to treat the date as local, not UTC
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const daysUntil = (dateStr) => {
  const today = new Date();// new Date() gives us the current date and time
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + 'T00:00:00'); 
  const thisYear = eventDate;
  thisYear.setFullYear(today.getFullYear());
  if (thisYear < today) thisYear.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24));
  return diff;
}; 


const TIMEFRAME_OPTIONS = [
  { label: 'Next 7 Days', value: 7 },
  { label: 'Next 30 Days', value: 30 },
  { label: 'Next 90 Days', value: 90 },
  { label: 'Next Year', value: 365 },
];

const filterEventsByTimeframe = (allEvents, days) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoffDate = new Date(today);
  cutoffDate.setDate(cutoffDate.getDate() + days); 

  return allEvents.filter((event) => {
    const eventDate = new Date(event.eventDate + 'T00:00:00');
    const thisYear = new Date(eventDate);
    thisYear.setFullYear(today.getFullYear());

    // If event has already passed this year, move to next year
    if (thisYear < today) {
      thisYear.setFullYear(today.getFullYear() + 1);
    }

    return thisYear <= cutoffDate;
  });
};

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(7);

  useEffect(() => {
    const fetchUpcoming = async () => {
      try {
        const { data } = await api.get(`/upcoming?days=${selectedTimeframe}`);
        setEvents(data);
      } catch (err) {
        console.error('Failed to load upcoming events', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUpcoming();
  }, [selectedTimeframe]); // Refetch if number of events changes, to keep the dashboard up to date after edits

  const getTimeframeLabel = () => {
    const option = TIMEFRAME_OPTIONS.find(opt => opt.value === selectedTimeframe);
    return option ? option.label.toLowerCase() : 'next 7 days';
  };

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>👋 Hello, {user?.username}</h1>
        <p>Here's what's coming up in the {getTimeframeLabel()}</p>
      </div>

      {/* Timeframe selector */}
      <div className="timeframe-selector card">
        <span className="timeframe-label">View events for:</span>
        <div className="timeframe-buttons">
          {TIMEFRAME_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={`btn btn-sm ${selectedTimeframe === option.value ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedTimeframe(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-icon stat-icon--purple">
            <FiCalendar />
          </div>
          <div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon stat-icon--amber">
            <FiGift />
          </div>
          <div>
            <div className="stat-value">
              {events.filter((e) => (e.eventType || '').toLowerCase().includes('birthday')).length}
            </div>
            <div className="stat-label">Birthdays</div>
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon stat-icon--blue">
            <FiAward />
          </div>
          <div>
            <div className="stat-value">
              {events.filter((e) => (e.eventType || '').toLowerCase().includes('anniversary')).length}
            </div>
            <div className="stat-label">Anniversaries</div>
          </div>
        </div>
      </div>

      {/* Event cards */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🎉</div>
          <p>No events {getTimeframeLabel()}.</p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Try selecting a longer timeframe!</p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((event) => {
            const days = daysUntil(event.eventDate);
            return (
              <div className="card event-card" key={event.id}>
                <div className="event-card-top">
                  <div className={`event-card-icon ${eventBadge(event.eventType)}`}>
                    {eventIcon(event.eventType)}
                  </div>
                  <div className="event-card-meta">
                    <span className={`badge ${eventBadge(event.eventType)}`}>
                      {event.eventType || 'Event'}
                    </span>
                    <span className="event-card-date">
                      {formatDate(event.eventDate)}
                    </span>
                  </div>
                </div>

                <h3 className="event-card-title">
                  {event.user?.username || 'Someone'}
                </h3>
                <p className="event-card-desc">
                  {event.description || 'No description'}
                </p>

                <div className="event-card-footer">
                  <span className={`days-badge ${days === 0 ? 'days-today' : days <= 2 ? 'days-soon' : ''}`}>
                    {days === 0 ? '🎉 Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
