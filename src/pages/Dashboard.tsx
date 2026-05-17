import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvents, searchEvents, deleteEvent, getGuests, type WeddingEvent } from '../lib/db';
import { seedDummyData } from '../lib/seedData';
import { Search, Plus, LogOut, Heart, Calendar, MapPin, Trash2, Eye, RefreshCw, Database } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<WeddingEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = () => {
    setEvents(getEvents());
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setEvents(searchEvents(query));
    } else {
      loadEvents();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteEvent(id);
      loadEvents();
    }
  };

  const handleResetAllData = () => {
    if (confirm('⚠️ This will delete ALL users, events, and RSVPs. Are you sure?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleSeedDummyData = () => {
    if (confirm('🌱 This will add 8 users, 7 events, 60+ guests, 15+ messages, and 5+ uploaded lists. Continue?')) {
      seedDummyData();
      loadEvents();
      alert('✅ Dummy data added successfully! Check your dashboard.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Calculate global statistics
  const allGuests = getGuests();
  const totalEvents = events.length;
  const totalRSVPs = allGuests.length;
  const totalGuests = allGuests.reduce((sum, guest) => {
    return sum + 1 + (guest.additionalGuests?.length || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wedding RSVP
              </span>
            </Link>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 hidden sm:block">
                Welcome, <span className="font-semibold text-gray-900">{user?.name}</span>
              </span>
              
              <button
                onClick={handleSeedDummyData}
                className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-200"
              >
                <Database className="w-4 h-4" />
                <span className="hidden sm:inline">Seed Data</span>
              </button>

              <button
                onClick={handleResetAllData}
                className="flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-xl transition-all border border-orange-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Wedding Events</h1>
          <p className="text-gray-500">Manage your events and track RSVPs</p>
        </div>

        {/* Global Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{totalEvents}</div>
            <div className="text-sm text-gray-500 mt-1">Total Events</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-rose-600">{totalRSVPs}</div>
            <div className="text-sm text-gray-500 mt-1">Total RSVPs</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">{totalGuests}</div>
            <div className="text-sm text-gray-500 mt-1">Total Guests</div>
          </div>
        </div>

        {/* Search & Create */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Search events by couple name or venue..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            />
          </div>
          <button
            onClick={() => navigate('/create-event')}
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-pink-700 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Heart className="w-16 h-16 text-rose-200 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-gray-400 mb-3">No events yet</h3>
            <p className="text-gray-500 mb-6">Create your first wedding event to get started</p>
            <button
              onClick={() => navigate('/create-event')}
              className="px-8 py-3 bg-rose-500 text-white rounded-2xl font-medium hover:bg-rose-600"
            >
              Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div key={event.id} className="group bg-white rounded-3xl overflow-hidden shadow hover:shadow-xl transition-all border border-gray-100">
                <div className="relative h-60">
                  <img
                    src={event.coverImage || 'https://via.placeholder.com/600x400?text=Wedding'}
                    alt={event.groomName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-white text-2xl font-bold">{event.groomName} & {event.brideName}</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(event.id); }}
                    className="absolute top-4 right-4 p-2 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.weddingDate).toLocaleDateString('en-IN', { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                    <MapPin className="w-4 h-4" />
                    {event.venue}
                  </div>

                  <Link
                    to={`/event/${event.id}`}
                    className="block w-full py-3.5 text-center bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-semibold hover:from-rose-600 hover:to-pink-700 transition-all"
                  >
                    View Event &amp; RSVPs
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}