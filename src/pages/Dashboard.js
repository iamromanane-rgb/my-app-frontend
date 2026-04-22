import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiGift, FiAward, FiStar, FiCalendar, FiX, FiSearch } from 'react-icons/fi';
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
  const [selectedEventType, setSelectedEventType] = useState('all'); // all, birthday, anniversary, other
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

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
  }, [selectedTimeframe]);

  // Handle user search with autocomplete
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSuggestedUsers([]);
      setShowDropdown(false);
      return;
    }

    // Get unique users from events
    const allUsers = [...new Set(events.map(e => e.user))].filter(Boolean);
    
    // Filter users based on search query
    const filtered = allUsers.filter(u =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Remove already selected users from suggestions
    const suggestions = filtered.filter(u => !selectedUsers.find(su => su.id === u.id));
    setSuggestedUsers(suggestions);
    setShowDropdown(true);
  }, [searchQuery, events, selectedUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) &&
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter events based on selected filters
  const filteredEvents = events.filter(event => {
    // Filter by event type
    if (selectedEventType !== 'all') {
      const eventType = (event.eventType || '').toLowerCase();
      if (selectedEventType === 'birthday' && !eventType.includes('birthday')) return false;
      if (selectedEventType === 'anniversary' && !eventType.includes('anniversary')) return false;
      if (selectedEventType === 'other' && (eventType.includes('birthday') || eventType.includes('anniversary'))) return false;
    }

    // Filter by selected users
    if (selectedUsers.length > 0) {
      return selectedUsers.some(u => u.id === event.user?.id);
    }

    return true;
  });

  const getTimeframeLabel = () => {
    const option = TIMEFRAME_OPTIONS.find(opt => opt.value === selectedTimeframe);
    return option ? option.label.toLowerCase() : 'next 7 days';
  };

  const handleAddUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setSuggestedUsers([]);
    setShowDropdown(false);
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const birthdayCount = events.filter((e) => (e.eventType || '').toLowerCase().includes('birthday')).length;
  const anniversaryCount = events.filter((e) => (e.eventType || '').toLowerCase().includes('anniversary')).length;
  const otherCount = events.filter((e) => {
    const t = (e.eventType || '').toLowerCase();
    return !t.includes('birthday') && !t.includes('anniversary');
  }).length;

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

      {/* Stat cards - now clickable to filter by event type */}
      <div className="stats-grid">
        <div 
          className={`card stat-card ${selectedEventType === 'all' ? 'stat-card--active' : 'stat-card--clickable'}`}
          onClick={() => setSelectedEventType('all')}
          title="Click to see all events"
        >
          <div className="stat-icon stat-icon--purple">
            <FiCalendar />
          </div>
          <div>
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Upcoming Events</div>
          </div>
        </div>
        <div 
          className={`card stat-card ${selectedEventType === 'birthday' ? 'stat-card--active' : 'stat-card--clickable'}`}
          onClick={() => setSelectedEventType('birthday')}
          title="Click to see only birthdays"
        >
          <div className="stat-icon stat-icon--amber">
            <FiGift />
          </div>
          <div>
            <div className="stat-value">{birthdayCount}</div>
            <div className="stat-label">Birthdays</div>
          </div>
        </div>
        <div 
          className={`card stat-card ${selectedEventType === 'anniversary' ? 'stat-card--active' : 'stat-card--clickable'}`}
          onClick={() => setSelectedEventType('anniversary')}
          title="Click to see only anniversaries"
        >
          <div className="stat-icon stat-icon--blue">
            <FiAward />
          </div>
          <div>
            <div className="stat-value">{anniversaryCount}</div>
            <div className="stat-label">Anniversaries</div>
          </div>
        </div>
        {otherCount > 0 && (
          <div 
            className={`card stat-card ${selectedEventType === 'other' ? 'stat-card--active' : 'stat-card--clickable'}`}
            onClick={() => setSelectedEventType('other')}
            title="Click to see other events"
          >
            <div className="stat-icon stat-icon--other">
              <FiStar />
            </div>
            <div>
              <div className="stat-value">{otherCount}</div>
              <div className="stat-label">Other Events</div>
            </div>
          </div>
        )}
      </div>

      {/* Search and filter section */}
      <div className="filter-section card">
        <div className="search-container">
          <FiSearch className="search-icon" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search user by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() !== '' && setShowDropdown(true)}
            className="search-input"
          />
          
          {/* Autocomplete dropdown */}
          {showDropdown && suggestedUsers.length > 0 && (
            <div ref={dropdownRef} className="search-dropdown">
              {suggestedUsers.map((u) => (
                <div
                  key={u.id}
                  className="dropdown-item"
                  onClick={() => handleAddUser(u)}
                >
                  {u.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected users chips */}
        {selectedUsers.length > 0 && (
          <div className="selected-users">
            {selectedUsers.map((u) => (
              <div key={u.id} className="user-chip">
                <span>{u.username}</span>
                <button
                  onClick={() => handleRemoveUser(u.id)}
                  className="chip-remove"
                  aria-label={`Remove ${u.username}`}
                >
                  <FiX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active filters display */}
      {(selectedEventType !== 'all' || selectedUsers.length > 0) && (
        <div className="active-filters">
          <span className="filter-label">Active Filters:</span>
          {selectedEventType !== 'all' && (
            <span className="filter-badge">
              {selectedEventType.charAt(0).toUpperCase() + selectedEventType.slice(1)}
              <button
                onClick={() => setSelectedEventType('all')}
                className="filter-badge-remove"
              >
                <FiX size={14} />
              </button>
            </span>
          )}
          {selectedUsers.map(u => (
            <span key={u.id} className="filter-badge">
              {u.username}
              <button
                onClick={() => handleRemoveUser(u.id)}
                className="filter-badge-remove"
              >
                <FiX size={14} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Event cards */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🎉</div>
          <p>
            {selectedEventType !== 'all' || selectedUsers.length > 0
              ? 'No events match your filters.'
              : `No events ${getTimeframeLabel()}.`}
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: 4 }}>
            {selectedEventType !== 'all' || selectedUsers.length > 0
              ? 'Try adjusting your filters.'
              : 'Try selecting a longer timeframe!'}
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => {
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
