import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getGuestsByEvent, createMessage, type WeddingEvent, type Guest } from '../lib/db';
import { Heart, Search, ChevronDown, ChevronRight, Filter, Download, Users, Plus, Trash2, FileText, X, Send, MessageCircle } from 'lucide-react';

export default function GuestList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGuests, setExpandedGuests] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'Yes' | 'Maybe' | 'Cannot attend'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status'>('name');
  const [showBanner, setShowBanner] = useState(true);

  // Message modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedGuestForMessage, setSelectedGuestForMessage] = useState<Guest | null>(null);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [messageSuccess, setMessageSuccess] = useState('');

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) {
        setEvent(ev);
        setGuests(getGuestsByEvent(id));
      }
    }
  }, [id]);

  // Filter and search logic
  const filteredGuests = useMemo(() => {
    let result = guests;

    // Search filter - includes main guest and additional guests
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((guest) => {
        // Search in main guest fields
        const mainGuestMatch =
          (guest.name && guest.name.toLowerCase().includes(query)) ||
          (guest.email && guest.email.toLowerCase().includes(query)) ||
          (guest.mobile && guest.mobile.toString().includes(query)) ||
          (guest.city && guest.city.toLowerCase().includes(query));

        // Also search in additional guests
        const additionalGuestMatch =
          guest.additionalGuests && guest.additionalGuests.length > 0
            ? guest.additionalGuests.some(
                (addGuest) =>
                  (addGuest.name && addGuest.name.toLowerCase().includes(query)) ||
                  (addGuest.email && addGuest.email.toLowerCase().includes(query)) ||
                  (addGuest.mobile && addGuest.mobile.toString().includes(query))
              )
            : false;

        return mainGuestMatch || additionalGuestMatch;
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((guest) => guest.attendanceStatus === filterStatus);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
      } else if (sortBy === 'status') {
        const statusOrder = { 'Yes': 0, 'Maybe': 1, 'Cannot attend': 2 };
        return statusOrder[a.attendanceStatus as keyof typeof statusOrder] - statusOrder[b.attendanceStatus as keyof typeof statusOrder];
      }
      return 0;
    });

    return result;
  }, [guests, searchQuery, filterStatus, sortBy]);

  const toggleGuestExpanded = (guestId: string) => {
    setExpandedGuests((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const toggleSelectGuest = (guestId: string) => {
    setSelectedGuests((prev) =>
      prev.includes(guestId) ? prev.filter((id) => id !== guestId) : [...prev, guestId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGuests.length === filteredGuests.length) {
      setSelectedGuests([]);
    } else {
      setSelectedGuests(filteredGuests.map((g) => g.id));
    }
  };

  const openMessageModal = (guest: Guest) => {
    setSelectedGuestForMessage(guest);
    setMessageSubject('');
    setMessageBody('');
    setMessageError('');
    setMessageSuccess('');
    setShowMessageModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedGuestForMessage) return;

    if (!messageSubject.trim()) {
      setMessageError('Please enter a message subject');
      return;
    }

    if (!messageBody.trim()) {
      setMessageError('Please enter a message body');
      return;
    }

    setIsSendingMessage(true);
    setMessageError('');

    try {
      // Create a manual message
      createMessage({
        eventId: id!,
        title: messageSubject,
        content: messageBody,
        selectedFunctions: Object.keys(selectedGuestForMessage.functionAttendance).filter(
          (func) => selectedGuestForMessage.functionAttendance[func] === 'Yes'
        ),
        createdBy: 'admin',
        sentAt: new Date().toISOString(),
        totalRecipients: 1,
        recipientGuestIds: [selectedGuestForMessage.id],
        isAutoSent: false,
      });

      setMessageSuccess(`Message sent to ${selectedGuestForMessage.name}!`);
      setTimeout(() => {
        setShowMessageModal(false);
        setSelectedGuestForMessage(null);
        setMessageSubject('');
        setMessageBody('');
        setMessageSuccess('');
      }, 2000);
    } catch (err) {
      setMessageError('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-rose-600 hover:underline"
          >
            Go back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalGuests = guests.reduce((sum, g) => sum + 1 + (g.additionalGuests?.length || 0), 0);
  const acceptedGuests = guests.filter((g) => g.attendanceStatus === 'Yes').length;
  const pendingGuests = guests.filter((g) => g.attendanceStatus === 'Maybe').length;
  const declinedGuests = guests.filter((g) => g.attendanceStatus === 'Cannot attend').length;

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

            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-medium">
                <Download className="w-4 h-4" />
                Export
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50 transition-all text-sm font-medium">
                <Send className="w-4 h-4" />
                Send
              </button>
              <button
                onClick={() => navigate(`/event/${id}`)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                Back to Event
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Page Title & Stats */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Guest List</h1>
          <p className="text-gray-600 mb-6">
            {event.groomName} & {event.brideName} • {new Date(event.weddingDate).toLocaleDateString('en-IN')}
          </p>

          {/* Statistics Cards */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Guests</div>
              <div className="text-3xl font-bold text-gray-900">{totalGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-green-100">
              <div className="text-sm text-green-600 mb-1">Accepted</div>
              <div className="text-3xl font-bold text-green-600">{acceptedGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-yellow-100">
              <div className="text-sm text-yellow-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-yellow-600">{pendingGuests}</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-red-100">
              <div className="text-sm text-red-600 mb-1">Declined</div>
              <div className="text-3xl font-bold text-red-600">{declinedGuests}</div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        {showBanner && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-400 flex-shrink-0 mt-0.5 flex items-center justify-center text-white text-xs font-bold">
                💡
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-0.5">
                  Populate your guest list with a single magic link
                </p>
                <p className="text-sm text-blue-700">
                  <button className="font-medium hover:underline">Try Contact Collector</button>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBanner(false)}
              className="text-blue-400 hover:text-blue-600 transition-colors flex-shrink-0 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Toolbar with Filter Options */}
        <div className="bg-white rounded-t-xl border border-gray-200 border-b-0 p-4 flex items-center gap-2 overflow-x-auto">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <FileText className="w-4 h-4" />
            RSVP Tracking
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Users className="w-4 h-4" />
            Create Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Users className="w-4 h-4" />
            Make Head
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Plus className="w-4 h-4" />
            Add to Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Trash2 className="w-4 h-4" />
            Remove from Party
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Download className="w-4 h-4" />
            Merge Duplicates
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Trash2 className="w-4 h-4" />
            Delete Guest
          </button>
          <div className="flex-1"></div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
            <Filter className="w-4 h-4" />
            Columns
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white border border-gray-200 border-t-0 p-4 rounded-b-xl mb-8">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              >
                <option value="all">All RSVP Status</option>
                <option value="Yes">✓ Accepted</option>
                <option value="Maybe">Pending</option>
                <option value="Cannot attend">Declined</option>
              </select>
            </div>

            {/* Sort */}
            <div className="w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="status">Sort by Status</option>
              </select>
            </div>

            {/* Search Options */}
            <button className="flex items-center gap-1 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Filter className="w-4 h-4" />
              <span className="text-xs">More filters</span>
            </button>
          </div>
        </div>

        {/* Guest Table/List */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No guests found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredGuests.length > 0 && selectedGuests.length === filteredGuests.length
                        }
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      First Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      Last Name
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      Phone Number
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      Email Address
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap">
                      Signed-In
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap">
                      Sangeet
                    </th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-900 whitespace-nowrap">
                      Shaadi
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      Tags
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      City
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-900 whitespace-nowrap">
                      Source
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-900 whitespace-nowrap pr-8">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => {
                    const firstName = guest.name.split(' ')[0];
                    const lastName = guest.name.split(' ').slice(1).join(' ');
                    const isExpanded = expandedGuests.includes(guest.id);
                    const initials = (guest.name.split(' ')[0][0] + (guest.name.split(' ')[1]?.[0] || '')).toUpperCase();

                    return (
                      <tbody key={guest.id}>
                        {/* Main Row */}
                        <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={selectedGuests.includes(guest.id)}
                              onChange={() => toggleSelectGuest(guest.id)}
                              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                {initials}
                              </div>
                              <span className="text-gray-900 font-medium">{firstName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            <a href={`mailto:${guest.email}`} className="hover:text-rose-600 text-blue-600">
                              {lastName}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{guest.mobile}</td>
                          <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{guest.email}</td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                          </td>
                          <td className="px-4 py-3 text-center">
                            {guest.attendanceStatus === 'Yes' && (
                              <span className="inline-flex items-center justify-center">
                                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {guest.attendanceStatus === 'Yes' && (
                              <span className="inline-flex items-center justify-center">
                                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                                  ✓
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {guest.city}
                              </span>
                              {guest.needsAccommodation && (
                                <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                  Accommodation
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{guest.city}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                              guest.uploadSource === 'BulkUpload'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {guest.uploadSource === 'BulkUpload' ? 'Uploaded' : 'RSVP Form'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openMessageModal(guest)}
                                className="inline-flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors p-2 hover:bg-rose-50 rounded"
                                title="Send message to this guest"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleGuestExpanded(guest.id)}
                                className="inline-flex items-center justify-center text-gray-500 hover:text-rose-600 transition-colors p-1 hover:bg-gray-100 rounded"
                              >
                                {guest.additionalGuests && guest.additionalGuests.length > 0 ? (
                                  isExpanded ? (
                                    <ChevronDown className="w-5 h-5" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5" />
                                  )
                                ) : (
                                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details */}
                        {isExpanded && guest.additionalGuests && guest.additionalGuests.length > 0 && (
                          <tr className="bg-gray-50 border-b border-gray-100">
                            <td colSpan={11} className="px-6 py-4">
                              <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <Users className="w-4 h-4" /> Additional Guests ({guest.additionalGuests.length})
                                </h4>
                                <div className="space-y-2">
                                  {guest.additionalGuests.map((addGuest, idx) => (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200 flex items-start justify-between">
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          {addGuest.name}
                                          <span className="text-sm text-gray-500 font-normal ml-2">
                                            • {addGuest.relation} • {addGuest.age} years
                                          </span>
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                          📧 {addGuest.email} | 📱 {addGuest.mobile}
                                        </div>
                                      </div>
                                      <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="mt-6 text-sm text-gray-600 px-4 py-3">
          Showing <span className="font-medium text-gray-900">{filteredGuests.length}</span> of <span className="font-medium text-gray-900">{guests.length}</span> guests
          {selectedGuests.length > 0 && <span> • <span className="font-medium text-rose-600">{selectedGuests.length} selected</span></span>}
        </div>
      </main>

      {/* Message Modal */}
      {showMessageModal && selectedGuestForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <MessageCircle size={24} />
                Send Message to {selectedGuestForMessage.name}
              </h2>
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedGuestForMessage(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {messageError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{messageError}</p>
                </div>
              )}

              {messageSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-700 text-sm">{messageSuccess}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Subject
                </label>
                <input
                  type="text"
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  placeholder="e.g., Important Update for Wedding Ceremony"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message Body
                </label>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Guest Details:</strong><br />
                  Email: {selectedGuestForMessage.email}<br />
                  Mobile: {selectedGuestForMessage.mobile}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setSelectedGuestForMessage(null);
                  setMessageSubject('');
                  setMessageBody('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={isSendingMessage}
                className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingMessage ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
