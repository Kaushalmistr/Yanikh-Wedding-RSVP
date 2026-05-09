import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, getGuestsByEvent, type WeddingEvent, type Guest } from '../lib/db';
import { Heart, ArrowLeft, Calendar, MapPin, Users, Download, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DEFAULT_COVER_IMAGE } from '../lib/constants';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [showGuests, setShowGuests] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) {
        setEvent(ev);
        setGuests(getGuestsByEvent(id));
      }
    }
  }, [id]);

  // Correct Total Guests Calculation
  const calculateTotalGuests = (guestList: Guest[]) => {
    return guestList.reduce((total, guest) => {
      return total + 1 + (guest.additionalGuests?.length || 0);
    }, 0);
  };

  const totalRSVPs = guests.length;
  const totalGuestsAttending = calculateTotalGuests(guests);
  const notAttending = guests.filter(g => g.attendanceStatus === 'Cannot attend').length;

  const exportToExcel = () => {
    if (guests.length === 0) {
      alert('No guest data to export');
      return;
    }

    const exportData = guests.map((guest, index) => ({
      'Sr No': index + 1,
      'Name': guest.name,
      'Gender': guest.gender || '',
      'Email': guest.email,
      'Mobile': guest.mobile,
      'City': guest.city,
      'Attendance': guest.attendanceStatus,
      'Total Guests': 1 + (guest.additionalGuests?.length || 0),
      'Additional Guests': guest.additionalGuests?.length || 0,
      'Needs Accommodation': guest.needsAccommodation ? 'Yes' : 'No',
      'Meal Preference': guest.mealPreference || 'No Preference',
      'Special Assistance': guest.specialAssistance?.join(', ') || 'None',
      'Additional Notes': guest.additionalNotes || '',
      'Submitted On': new Date(guest.submittedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Guest List");
    XLSX.writeFile(wb, `${event?.groomName}_${event?.brideName}_GuestList.xlsx`);
  };

  const openGuestDetails = (guest: Guest) => {
    setSelectedGuest(guest);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-rose-50/30 to-pink-50/30">
      <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center gap-2">
              <Heart className="w-7 h-7 text-rose-500" fill="currentColor" />
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                Wedding RSVP
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-rose-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Hero */}
        <div className="relative rounded-3xl overflow-hidden mb-8 shadow-2xl h-[380px]">
          <img src={event.coverImage || DEFAULT_COVER_IMAGE} alt="Wedding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">{event.groomName} & {event.brideName}</h1>
            <div className="flex gap-6 text-sm">
              <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {new Date(event.weddingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.venue}</span>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-gray-900">{totalRSVPs}</div>
            <div className="text-sm text-gray-500">Total RSVPs</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-emerald-600">{totalGuestsAttending}</div>
            <div className="text-sm text-gray-500">Total Guests Attending</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="text-3xl font-bold text-rose-600">{notAttending}</div>
            <div className="text-sm text-gray-500">Not Attending</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center mb-12">
          <button onClick={() => navigate(`/rsvp/${event.id}`)} className="px-10 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-bold text-lg hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg flex items-center gap-3">
            <Heart className="w-6 h-6" fill="white" /> New RSVP
          </button>

          {guests.length > 0 && (
            <button onClick={exportToExcel} className="px-8 py-4 bg-white border border-gray-300 hover:border-emerald-400 text-gray-700 rounded-2xl font-semibold flex items-center gap-3 hover:bg-emerald-50 transition-all">
              <Download className="w-5 h-5" /> Export to Excel
            </button>
          )}
        </div>

        {/* Guest List */}
        {guests.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowGuests(!showGuests)} className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-900">Guest List ({guests.length} RSVPs • {totalGuestsAttending} People)</span>
              </div>
              <span className="text-2xl text-gray-400">{showGuests ? '−' : '+'}</span>
            </button>

            {showGuests && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">NAME</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">EMAIL</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">CITY</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">STATUS</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">TOTAL GUESTS</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {guests.map(guest => {
                      const total = 1 + (guest.additionalGuests?.length || 0);
                      return (
                        <tr key={guest.id} className="hover:bg-gray-50">
                          <td className="px-6 py-5 font-medium">{guest.name}</td>
                          <td className="px-6 py-5 text-gray-600">{guest.email}</td>
                          <td className="px-6 py-5 text-gray-600">{guest.city}</td>
                          <td className="px-6 py-5">
                            <span className={`px-4 py-1 rounded-full text-xs font-medium ${
                              guest.attendanceStatus === 'Yes' ? 'bg-green-100 text-green-700' :
                              guest.attendanceStatus === 'Maybe' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {guest.attendanceStatus}
                            </span>
                          </td>
                          <td className="px-6 py-5 font-semibold text-gray-700">{total}</td>
                          <td className="px-6 py-5">
                            <button onClick={() => openGuestDetails(guest)} className="flex items-center gap-2 px-5 py-2 bg-gray-100 hover:bg-rose-100 hover:text-rose-700 rounded-2xl text-sm transition-all">
                              <Eye className="w-4 h-4" /> View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
                  <p><strong>Gender:</strong> {selectedGuest.gender}</p>
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