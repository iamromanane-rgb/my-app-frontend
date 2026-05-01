import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FiGift, FiAward, FiStar, FiCalendar, FiX, FiSearch, FiGrid, FiList, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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
  const diff = Math.ceil((thisYear - today) / (1000 * 60 * 60 * 24)); // 1000 * 60 * 60 * 24 converts milliseconds to days
  return diff;
}; 


const TIMEFRAME_OPTIONS = [
  { label: 'Next 7 Days', value: 7 },
  { label: 'Next 30 Days', value: 30 },
  { label: 'Next 90 Days', value: 90 },
  { label: 'Next Year', value: 365 },
];

const filterEventsByTimeframe = (allEvents, days) => { // filter the cached events based on the selected timeframe 
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

// Helper functions for calendar view
const getDaysInMonth = (date) => { //calculate how many days in a month
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

const getFirstDayOfMonth = (date) => { //get which day of week the month starts on (0=Sun, 1=Mon, etc.)
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
};

const getCalendarDays = (date) => { // generate an array representing the calendar grid for the given month, with nulls for empty cells before the first day of the month
  const daysInMonth = getDaysInMonth(date); //30
  const firstDay = getFirstDayOfMonth(date); // 3
  const days = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  
  // Add days of month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  
  return days; // returns an array like [null, null, null, 1, 2, 3, ..., 30] for a month that starts on Wednesday and has 30 days
};

const getEventsForDate = (events, year, month, day) => {
  if (!day) return [];
  return events.filter(event => {
    const eventDate = new Date(event.eventDate + 'T00:00:00');
    return eventDate.getDate() === day && 
           eventDate.getMonth() === month && 
           eventDate.getFullYear() === year;
  });
};

const getYearlyRecurringEventsForDate = (events, month, day) => {
  // For recurring yearly events
  return events.filter(event => {
    const eventDate = new Date(event.eventDate + 'T00:00:00');
    return eventDate.getDate() === day && eventDate.getMonth() === month;
  });
};

const Dashboard = () => {
  const { user } = useAuth();
  const [allEventsCache, setAllEventsCache] = useState([]); // Cache for all events
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState(7);
  const [selectedEventType, setSelectedEventType] = useState('all'); // all, birthday, anniversary, other
  const [selectedUsers, setSelectedUsers] = useState([]); // users selected for filtering in search section
  const [searchQuery, setSearchQuery] = useState(''); // For user search in filter section
  const [suggestedUsers, setSuggestedUsers] = useState([]); // For autocomplete suggestions based on search
  const [showDropdown, setShowDropdown] = useState(false); // to show autocomplete dropdown
  const [viewMode, setViewMode] = useState('grid'); // list, grid, calendar
  const [calendarMonth, setCalendarMonth] = useState(new Date()); // which month to show in calendar view
  const [selectedDate, setSelectedDate] = useState(null); // for calendar view - which date is selected to show details for
  const [detailedEvent, setDetailedEvent] = useState(null); // For event details modal
  const [cacheLoaded, setCacheLoaded] = useState(false); // Track if cache is loaded
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch all events once on component mount (full year cache)
  useEffect(() => {
    const fetchAllEventsCache = async () => {
      try {
        setLoading(true);
        // Fetch entire year of events for caching
        const { data } = await api.get('/upcoming?days=365');
        setAllEventsCache(data);
        setCacheLoaded(true);
      } catch (err) {
        console.error('Failed to load events cache', err);
        setLoading(false);
      }
    };
    fetchAllEventsCache();
  }, []);

  // Filter cached events based on selected timeframe (no API call)
  useEffect(() => {
    if (!cacheLoaded) return;

    const filteredByTimeframe = filterEventsByTimeframe(allEventsCache, selectedTimeframe);
    setEvents(filteredByTimeframe);
    setLoading(false);
  }, [selectedTimeframe, cacheLoaded, allEventsCache]);

  // Invalidate cache and refetch when needed (call this after create/update/delete)
  const invalidateCache = async () => {
    try {
      const { data } = await api.get('/upcoming?days=365');
      setAllEventsCache(data);
    } catch (err) {
      console.error('Failed to refresh events cache', err);
    }
  };

  // Listen for cache invalidation events from other components (MyEvents, event creation, etc.)
  useEffect(() => {
    const handleCacheInvalidation = () => {
      invalidateCache();
    };

    window.addEventListener('eventsUpdated', handleCacheInvalidation);
    
    // Also check when page becomes visible (comes back to focus)
    const handleVisibilityChange = () => {
      if (!document.hidden) { // document.hidden is true when page is not visible , false when visible 
        invalidateCache();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('eventsUpdated', handleCacheInvalidation); // clean up event listener when component unmounts
      document.removeEventListener('visibilitychange', handleVisibilityChange); 
    };
  }, []);

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
      return selectedUsers.some(u => u.id === event.user?.id); // Check if event's user is in selected users
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

      {/* View mode toggle */}
      <div className="view-mode-toggle card">
        <div className="view-mode-buttons">
          <button
            className={`view-mode-btn ${viewMode === 'list' ? 'view-mode-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <FiList size={18} />
            <span>List</span>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'grid' ? 'view-mode-btn--active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <FiGrid size={18} />
            <span>Grid</span>
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'calendar' ? 'view-mode-btn--active' : ''}`}
            onClick={() => setViewMode('calendar')}
            title="Calendar view"
          >
            <FiCalendar size={18} />
            <span>Calendar</span>
          </button>
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

      {/* Event cards - different views */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : viewMode === 'calendar' ? (
        // CALENDAR VIEW
        <div className="card calendar-card">
          <div className="calendar-header">
            <button 
              className="calendar-nav-btn"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
            >
              <FiChevronLeft size={20} />
            </button>
            <h3 className="calendar-month-title">
              {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button 
              className="calendar-nav-btn"
              onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} 
            >
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getCalendarDays(calendarMonth).map((day, idx) => {
              const dayEvents = day ? getYearlyRecurringEventsForDate(filteredEvents, calendarMonth.getMonth(), day) : [];
              const isToday = day && new Date().toDateString() === new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day).toDateString();
              
              return (
                <div 
                  key={idx} 
                  className={`calendar-day ${day ? '' : 'calendar-day--empty'} ${isToday ? 'calendar-day--today' : ''} ${dayEvents.length > 0 ? 'calendar-day--has-events' : ''}`}
                  onClick={() => day && dayEvents.length > 0 && setSelectedDate({ day, month: calendarMonth.getMonth(), year: calendarMonth.getFullYear(), events: dayEvents })}
                >
                  {day && (
                    <>
                      <div className="calendar-day-num">{day}</div>
                      {dayEvents.length > 0 && (
                        <div className="calendar-day-events">
                          {dayEvents.slice(0, 2).map(e => (
                            <div
                              key={e.id}
                              className={`calendar-event-indicator ${eventBadge(e.eventType)}`}
                              title={e.user?.username}
                            >
                              {eventIcon(e.eventType)}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="calendar-event-more">+{dayEvents.length - 2}</span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
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
      ) : viewMode === 'grid' ? (
        // GRID VIEW
        <div className="event-grid">
          {filteredEvents.map((event) => {
            const days = daysUntil(event.eventDate);
            return (
              <div 
                className="card event-card event-card--interactive" 
                key={event.id}
                onClick={() => setDetailedEvent(event)}
              >
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
      ) : (
        // LIST VIEW
        <div className="event-list">
          {filteredEvents.map((event) => {
            const days = daysUntil(event.eventDate);
            return (
              <div 
                className="event-list-item card"
                key={event.id}
                onClick={() => setDetailedEvent(event)}
              >
                <div className="event-list-content">
                  <div className="event-list-icon">
                    <div className={`event-card-icon ${eventBadge(event.eventType)}`}>
                      {eventIcon(event.eventType)}
                    </div>
                  </div>
                  <div className="event-list-details">
                    <h4 className="event-list-name">{event.user?.username || 'Someone'}</h4>
                    <p className="event-list-date">{formatDate(event.eventDate)}</p>
                    {event.description && <p className="event-list-desc">{event.description}</p>}
                  </div>
                  <div className="event-list-info">
                    <span className={`badge ${eventBadge(event.eventType)}`}>
                      {event.eventType || 'Event'}
                    </span>
                    <span className={`days-badge ${days === 0 ? 'days-today' : days <= 2 ? 'days-soon' : ''}`}>
                      {days === 0 ? '🎉 Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event Details Modal */}
      {detailedEvent && (
        <div className="modal-overlay" onClick={() => setDetailedEvent(null)}>
          <div className="modal-content event-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Event Details</h2>
              <button className="modal-close" onClick={() => setDetailedEvent(null)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-field">
                <label>Person</label>
                <p className="detail-value">{detailedEvent.user?.username || 'Unknown'}</p>
              </div>
              <div className="detail-field">
                <label>Event Type</label>
                <span className={`badge ${eventBadge(detailedEvent.eventType)}`}>
                  {detailedEvent.eventType || 'Event'}
                </span>
              </div>
              <div className="detail-field">
                <label>Date</label>
                <p className="detail-value">{new Date(detailedEvent.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="detail-field">
                <label>Days Away</label>
                <p className="detail-value">
                  {daysUntil(detailedEvent.eventDate) === 0 ? '🎉 Today!' : daysUntil(detailedEvent.eventDate) === 1 ? 'Tomorrow' : `${daysUntil(detailedEvent.eventDate)} days`}
                </p>
              </div>
              {detailedEvent.description && (
                <div className="detail-field">
                  <label>Description</label>
                  <p className="detail-value">{detailedEvent.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Date Details Modal (from calendar click) */}
      {selectedDate && (
        <div className="modal-overlay" onClick={() => setSelectedDate(null)}>
          <div className="modal-content date-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Events on {new Date(selectedDate.year, selectedDate.month, selectedDate.day).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
              <button className="modal-close" onClick={() => setSelectedDate(null)}>
                <FiX size={24} />
              </button>
            </div>
            <div className="modal-body date-events-list">
              {selectedDate.events.map(event => (
                <div 
                  key={event.id}
                  className="date-event-item"
                  onClick={() => {
                    setDetailedEvent(event);
                    setSelectedDate(null);
                  }}
                >
                  <div className={`event-card-icon ${eventBadge(event.eventType)}`}>
                    {eventIcon(event.eventType)}
                  </div>
                  <div className="date-event-info">
                    <h4>{event.user?.username}</h4>
                    <span className={`badge ${eventBadge(event.eventType)}`}>{event.eventType}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
