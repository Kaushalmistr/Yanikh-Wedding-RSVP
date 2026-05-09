import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getGuestsByEvent, type WeddingEvent, type Guest } from '../lib/db';
import { Heart, Calendar, MapPin, Globe, Gift, Home, Mail, Clock, List, Bell, Package, Image, MessageCircle, Share2 } from 'lucide-react';
import { DEFAULT_COVER_IMAGE } from '../lib/constants';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showGuestListTable, setShowGuestListTable] = useState(false);

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) {
        setEvent(ev);
        setGuests(getGuestsByEvent(id));
      }
    }
  }, [id]);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h2>
          <button onClick={() => navigate('/dashboard')} className="text-rose-600 hover:underline">Go back to dashboard</button>
        </div>
      </div>
    );
  }

  const featureCards = [
    { icon: Globe, label: 'Website', color: 'from-blue-500 to-blue-600' },
    { icon: Gift, label: 'Registry', color: 'from-pink-500 to-pink-600' },
    { icon: Home, label: 'Guests Stays', color: 'from-purple-500 to-purple-600' },
    { icon: Mail, label: 'Collect Contacts', color: 'from-orange-500 to-orange-600' },
    { icon: Clock, label: 'Schedule', color: 'from-yellow-500 to-yellow-600' },
    { icon: List, label: 'Guest List', color: 'from-indigo-500 to-indigo-600' },
    { icon: Bell, label: 'Save the Dates', color: 'from-cyan-500 to-cyan-600' },
    { icon: Mail, label: 'Invitations', color: 'from-cyan-500 to-cyan-600' },
    { icon: Package, label: 'Stationery', color: 'from-teal-500 to-teal-600' },
    { icon: Heart, label: 'RSVP', color: 'from-orange-500 to-orange-600' },
    { icon: Image, label: 'Photo Moments', color: 'from-pink-500 to-red-600' },
    { icon: MessageCircle, label: 'Messaging', color: 'from-green-500 to-green-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-12">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wedding RSVP
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gray-50">
        {/* Title and Cover Image Section */}
        <div className="w-full px-12 py-16">
          <div className="grid grid-cols-[2fr_1fr] gap-16 max-w-7xl mx-auto items-start">
            <div>
              <h1 className="text-5xl font-light mb-8 text-gray-900">{event.groomName} & {event.brideName}</h1>
              <div className="space-y-4 text-gray-600">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{new Date(event.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-base">{event.venue}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="relative w-full h-60 rounded-3xl overflow-hidden shadow-2xl">
                <img src={event.coverImage || DEFAULT_COVER_IMAGE} alt="Wedding" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        {!showGuestListTable ? (
        <div className="w-full px-12 pb-20">
          <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
          {featureCards.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                onClick={() => feature.label === 'Guest List' && setShowGuestListTable(true)}
                className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-gray-100 hover:shadow-xl transition-all cursor-pointer min-h-[250px]"
              >
                <div className={`bg-gradient-to-br ${feature.color} p-5 rounded-full mb-6 transition-transform hover:scale-110`}>
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <span className="text-base font-medium text-gray-800 text-center">{feature.label}</span>
              </div>
            );
          })}
          </div>
        </div>
        ) : (
        /* Guest List Table View */
        <div className="w-full pb-20">
          <div className="px-6 py-8">
            <div className="mb-6 flex items-center justify-between px-6">
              <h2 className="text-3xl font-bold text-gray-900">Guest List</h2>
              <button 
                onClick={() => setShowGuestListTable(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all"
              >
                Back to Events
              </button>
            </div>
            
            {guests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No guests have responded yet</p>
              </div>
            ) : (
              <div className="bg-white border-b border-gray-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-max">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Mobile</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">City</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Attendance</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Adults</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Children</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Infants</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Accommodation</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Meal Preference</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Dietary Restrictions</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Special Assistance</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Notes</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {guests.map((guest) => (
                        <tr key={guest.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-gray-900">{guest.name}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{guest.email}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{guest.mobile}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{guest.city}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              guest.attendanceStatus === 'Yes' ? 'bg-green-100 text-green-700' :
                              guest.attendanceStatus === 'Maybe' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {guest.attendanceStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center font-medium">{guest.adults}</td>
                          <td className="px-6 py-4 text-gray-600 text-center font-medium">{guest.children}</td>
                          <td className="px-6 py-4 text-gray-600 text-center font-medium">{guest.infants}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              guest.needsAccommodation ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {guest.needsAccommodation ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{guest.mealPreference || '-'}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">{guest.dietaryRestrictions || '-'}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">{guest.specialAssistance?.join(', ') || '-'}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">{guest.additionalNotes || '-'}</td>
                          <td className="px-6 py-4 text-gray-600 text-sm">{new Date(guest.submittedAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </main>

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-8 border-b bg-gradient-to-r from-rose-50 to-pink-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">{selectedGuest.name}</h3>
                <p className="text-sm text-gray-500">Submitted on {new Date(selectedGuest.submittedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedGuest(null)} className="text-4xl text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="p-8 overflow-auto max-h-[65vh] space-y-8 text-sm">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">PERSONAL INFO</h4>
                  <p><strong>Email:</strong> {selectedGuest.email}</p>
                  <p><strong>Mobile:</strong> {selectedGuest.mobile}</p>
                  <p><strong>City:</strong> {selectedGuest.city}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">ATTENDANCE</h4>
                  <p><strong>Status:</strong> {selectedGuest.attendanceStatus}</p>
                  <p><strong>Total Guests:</strong> {1 + (selectedGuest.additionalGuests?.length || 0)}</p>
                </div>
              </div>

              {selectedGuest.additionalGuests && selectedGuest.additionalGuests.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">ADDITIONAL GUESTS ({selectedGuest.additionalGuests.length})</h4>
                  <div className="space-y-2">
                    {selectedGuest.additionalGuests.map((g: any, i: number) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-2xl">
                        {g.name} • {g.age} yrs • {g.gender} • {g.relation}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedGuest.additionalNotes && (
                <div>
                  <h4 className="font-semibold text-gray-500 mb-3">ADDITIONAL NOTES</h4>
                  <p className="bg-gray-50 p-6 rounded-2xl italic">"{selectedGuest.additionalNotes}"</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setSelectedGuest(null)} className="px-8 py-3 bg-gray-900 text-white rounded-2xl font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}