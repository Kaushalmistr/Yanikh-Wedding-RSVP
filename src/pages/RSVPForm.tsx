import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, addGuest, type WeddingEvent } from '../lib/db';
import { Heart, ArrowLeft, CheckCircle, Plus, Upload, User } from 'lucide-react';

const ID_TYPES = ['Aadhaar Card', 'Passport', 'Driving License', 'Voter ID'];
const TRAVEL_MODES = ['By Flight', 'By Train', 'By Car'];
const FUNCTIONS = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];

export default function RSVPForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    mobile: '',
    email: '',
    city: '',
    respondingFor: 'Self' as 'Self' | 'Couple' | 'Family',
    attendanceStatus: 'Yes' as 'Yes' | 'Maybe' | 'Cannot attend',
    functionAttendance: {} as Record<string, 'Yes' | 'No'>,
    additionalGuests: [] as Array<{ name: string; age: number; gender: string; relation: string }>,
    needsAccommodation: false,
    checkInDate: '',
    checkOutDate: '',
    numberOfRooms: 1,
    roomPreference: '',
    preferredRoommates: '',
    travelMode: '',
    flightTicket: null as File | null,
    trainTicket: null as File | null,
    idType: '',
    idNumber: '',
    idFront: null as File | null,
    idBack: null as File | null,
    mealPreference: 'No Preference',
    dietaryRestrictions: '',
    specialAssistance: [] as string[],
    celebrationParticipation: [] as string[],
    additionalNotes: '',
    infoAccurate: false,
    dataConsent: false,
  });

  const [newGuest, setNewGuest] = useState({ name: '', age: 0, gender: 'Male', relation: '' });

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) setEvent(ev);
    }
  }, [id]);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleFunction = (func: string) => {
    setFormData(prev => ({
      ...prev,
      functionAttendance: {
        ...prev.functionAttendance,
        [func]: prev.functionAttendance[func] === 'Yes' ? 'No' : 'Yes'
      }
    }));
  };

  const toggleAssistance = (item: string) => {
    setFormData(prev => ({
      ...prev,
      specialAssistance: prev.specialAssistance.includes(item)
        ? prev.specialAssistance.filter(i => i !== item)
        : [...prev.specialAssistance, item]
    }));
  };

  const toggleParticipation = (item: string) => {
    setFormData(prev => ({
      ...prev,
      celebrationParticipation: prev.celebrationParticipation.includes(item)
        ? prev.celebrationParticipation.filter(i => i !== item)
        : [...prev.celebrationParticipation, item]
    }));
  };

  const addAdditionalGuest = () => {
    if (!newGuest.name || !newGuest.relation) return;
    setFormData(prev => ({
      ...prev,
      additionalGuests: [...prev.additionalGuests, { ...newGuest }]
    }));
    setNewGuest({ name: '', age: 0, gender: 'Male', relation: '' });
  };

  const removeAdditionalGuest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: prev.additionalGuests.filter((_, i) => i !== index)
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name || !formData.mobile || !formData.email || !formData.city || !formData.idType || !formData.idNumber) {
        setError('Please fill all required fields including ID Proof');
        return false;
      }
    }
    if (step === 5) {
      if (!formData.infoAccurate || !formData.dataConsent) {
        setError('Please confirm the declaration');
        return false;
      }
    }
    setError('');
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, 5)); };
  const prevStep = () => { setStep(s => Math.max(s - 1, 1)); setError(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || !id) return;

    addGuest({
      eventId: id,
      name: formData.name,
      gender: formData.gender,
      mobile: formData.mobile,
      email: formData.email,
      city: formData.city,
      respondingFor: formData.respondingFor,
      attendanceStatus: formData.attendanceStatus,
      functionAttendance: formData.functionAttendance,
      adults: 1,
      children: 0,
      infants: 0,
      additionalGuests: formData.additionalGuests,
      needsAccommodation: formData.needsAccommodation,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      numberOfRooms: formData.numberOfRooms,
      roomPreference: formData.roomPreference,
      preferredRoommates: formData.preferredRoommates,
      travelMode: formData.travelMode,
      idType: formData.idType,
      idNumber: formData.idNumber,
      mealPreference: formData.mealPreference,
      dietaryRestrictions: formData.dietaryRestrictions,
      specialAssistance: formData.specialAssistance,
      celebrationParticipation: formData.celebrationParticipation,
      additionalNotes: formData.additionalNotes,
      infoAccurate: formData.infoAccurate,
      dataConsent: formData.dataConsent,
      submittedAt: new Date().toISOString(),
    });

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
          <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-3">Thank You!</h2>
          <p className="text-gray-600">Your RSVP has been successfully submitted.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-8 px-10 py-3 bg-rose-600 text-white rounded-2xl font-medium">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const sections = [
    { num: 1, title: "Personal Details" },
    { num: 2, title: "Attendance" },
    { num: 3, title: "Guests" },
    { num: 4, title: "Travel Details" },
    { num: 5, title: "Confirmation" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link to={`/event/${id}`} className="flex items-center gap-2 text-gray-600 hover:text-rose-600">
            <ArrowLeft className="w-5 h-5" /> Back to Event
          </Link>
          <div className="font-bold text-xl flex items-center gap-2">
            <Heart className="text-rose-500" fill="currentColor" /> Wedding RSVP
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900">{event?.groomName} & {event?.brideName}</h1>
          <p className="text-rose-600 mt-2">Please fill this detailed RSVP form</p>
        </div>

        <div className="flex justify-between mb-10 border-b pb-6">
          {sections.map(s => (
            <div key={s.num} onClick={() => setStep(s.num)}
              className={`cursor-pointer flex flex-col items-center ${step === s.num ? 'text-rose-600' : 'text-gray-400'}`}>
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border-2 mb-1 ${step === s.num ? 'border-rose-600 bg-rose-50 font-bold' : 'border-gray-200'}`}>
                {s.num}
              </div>
              <div className="text-[10px] font-medium tracking-widest uppercase text-center">{s.title}</div>
            </div>
          ))}
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl p-10">

          {/* STEP 1: Personal + ID Proof */}
          {step === 1 && (
            <div className="space-y-10">
              <h2 className="text-2xl font-bold flex items-center gap-2"><User className="w-6 h-6" /> Personal Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-sm font-medium mb-2">Full Name *</label>
                  <input type="text" value={formData.name} onChange={e => updateForm('name', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required /></div>
                <div><label className="block text-sm font-medium mb-2">Gender *</label>
                  <select value={formData.gender} onChange={e => updateForm('gender', e.target.value)} className="w-full px-5 py-4 border rounded-2xl">
                    <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                  </select></div>
                <div><label className="block text-sm font-medium mb-2">Mobile Number *</label>
                  <input type="tel" value={formData.mobile} onChange={e => updateForm('mobile', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required /></div>
                <div><label className="block text-sm font-medium mb-2">Email Address *</label>
                  <input type="email" value={formData.email} onChange={e => updateForm('email', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required /></div>
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">City of Residence *</label>
                  <input type="text" value={formData.city} onChange={e => updateForm('city', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required /></div>
              </div>

              {/* ID Proof */}
              <div className="border border-gray-200 rounded-3xl p-8 bg-gray-50">
                <h3 className="text-xl font-semibold mb-6">Government ID Proof</h3>
                <select value={formData.idType} onChange={e => updateForm('idType', e.target.value)} className="w-full px-5 py-4 border rounded-2xl mb-6" required>
                  <option value="">Select ID Type</option>
                  {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                {formData.idType && (
                  <div className="bg-white p-6 rounded-2xl border">
                    <h4 className="font-bold text-lg mb-4">PROOF DETAILS</h4>
                    <p className="mb-4"><strong>Type:</strong> {formData.idType}</p>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">{formData.idType} Number *</label>
                      <input type="text" value={formData.idNumber} onChange={e => updateForm('idNumber', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Front Side *</label>
                        <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-rose-400">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm mt-2">Upload Front Side</span>
                          <input type="file" className="hidden" onChange={(e) => updateForm('idFront', e.target.files?.[0] || null)} />
                        </label>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Back Side *</label>
                        <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-rose-400">
                          <Upload className="w-8 h-8 text-gray-400" />
                          <span className="text-sm mt-2">Upload Back Side</span>
                          <input type="file" className="hidden" onChange={(e) => updateForm('idBack', e.target.files?.[0] || null)} />
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Attendance */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold">Will you attend the wedding?</h2>
              <div className="flex gap-4">
                {(['Yes', 'Maybe', 'Cannot attend'] as const).map(status => (
                  <button key={status} type="button" onClick={() => updateForm('attendanceStatus', status)}
                    className={`flex-1 py-5 rounded-3xl font-semibold border-2 transition-all ${formData.attendanceStatus === status ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    {status}
                  </button>
                ))}
              </div>

              {formData.attendanceStatus !== 'Cannot attend' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Which functions will you attend?</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {FUNCTIONS.map(func => (
                      <div key={func} onClick={() => toggleFunction(func)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${formData.functionAttendance[func] === 'Yes' ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <span>{func}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.functionAttendance[func] === 'Yes' ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'}`}>
                          {formData.functionAttendance[func] === 'Yes' && <span className="text-white text-xs">✓</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Add Individual Guests (Simplified) */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold text-xl mb-2">Add Guests Coming With You</h3>
                <p className="text-gray-500 text-sm mb-6">Main guest (you) is already counted. Add other guests below.</p>

                {formData.additionalGuests.length > 0 && (
                  <div className="mb-8 space-y-3">
                    {formData.additionalGuests.map((g, i) => (
                      <div key={i} className="flex justify-between items-center bg-gray-50 px-6 py-4 rounded-2xl">
                        <div>{g.name} • {g.age} yrs • {g.gender} • {g.relation}</div>
                        <button onClick={() => removeAdditionalGuest(i)} className="text-red-500 text-sm font-medium">Remove</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-dashed border-gray-300 rounded-3xl p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Guest Name" value={newGuest.name} onChange={e => setNewGuest(g => ({...g, name: e.target.value}))} className="px-5 py-4 border rounded-2xl" />
                    <input type="number" placeholder="Age" value={newGuest.age || ''} onChange={e => setNewGuest(g => ({...g, age: parseInt(e.target.value) || 0}))} className="px-5 py-4 border rounded-2xl" />
                    <select value={newGuest.gender} onChange={e => setNewGuest(g => ({...g, gender: e.target.value as any}))} className="px-5 py-4 border rounded-2xl">
                      <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                    <input type="text" placeholder="Relation (Wife, Son, Friend...)" value={newGuest.relation} onChange={e => setNewGuest(g => ({...g, relation: e.target.value}))} className="px-5 py-4 border rounded-2xl" />
                  </div>
                  <button type="button" onClick={addAdditionalGuest} className="mt-6 w-full py-3.5 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" /> Add Guest
                  </button>
                </div>

                <p className="text-center text-sm text-gray-500 mt-6">
                  Total Guests = <strong>1 (You)</strong> + <strong>{formData.additionalGuests.length}</strong> = <strong>{1 + formData.additionalGuests.length}</strong>
                </p>
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input type="checkbox" checked={formData.needsAccommodation} onChange={e => updateForm('needsAccommodation', e.target.checked)} className="w-5 h-5 accent-rose-500" />
                  <span className="font-medium">I need hotel accommodation</span>
                </label>
              </div>
            </div>
          )}

          {/* STEP 4: Travel Details */}
          {step === 4 && (
            <div className="space-y-10">
              <h2 className="text-2xl font-bold">Share your Travel Details</h2>
              <div>
                <label className="block text-sm font-medium mb-4">Mode of Travel</label>
                <div className="grid grid-cols-3 gap-4">
                  {TRAVEL_MODES.map(mode => (
                    <button key={mode} type="button" onClick={() => updateForm('travelMode', mode)}
                      className={`py-6 rounded-2xl border-2 font-medium transition-all ${formData.travelMode === mode ? 'border-rose-500 bg-rose-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {formData.travelMode === 'By Flight' && (
                <div className="bg-gray-50 p-8 rounded-3xl">
                  <label className="block text-sm font-medium mb-3">Upload Flight Ticket</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center cursor-pointer hover:border-rose-400">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="font-medium">Click to upload Flight Ticket</span>
                    <input type="file" className="hidden" onChange={(e) => updateForm('flightTicket', e.target.files?.[0] || null)} />
                  </label>
                  {formData.flightTicket && <p className="text-green-600 text-sm mt-3">✓ {formData.flightTicket.name}</p>}
                </div>
              )}

              {formData.travelMode === 'By Train' && (
                <div className="bg-gray-50 p-8 rounded-3xl">
                  <label className="block text-sm font-medium mb-3">Upload Train Ticket</label>
                  <label className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center cursor-pointer hover:border-rose-400">
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <span className="font-medium">Click to upload Train Ticket</span>
                    <input type="file" className="hidden" onChange={(e) => updateForm('trainTicket', e.target.files?.[0] || null)} />
                  </label>
                  {formData.trainTicket && <p className="text-green-600 text-sm mt-3">✓ {formData.trainTicket.name}</p>}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Confirmation */}
          {step === 5 && (
            <div className="max-w-lg mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold">Final Confirmation</h2>
              <div className="space-y-6 text-left">
                <label className="flex gap-4 cursor-pointer">
                  <input type="checkbox" checked={formData.infoAccurate} onChange={e => updateForm('infoAccurate', e.target.checked)} className="mt-1 accent-rose-500 w-5 h-5" />
                  <span className="text-sm">I confirm that all the information provided is accurate to the best of my knowledge.</span>
                </label>
                <label className="flex gap-4 cursor-pointer">
                  <input type="checkbox" checked={formData.dataConsent} onChange={e => updateForm('dataConsent', e.target.checked)} className="mt-1 accent-rose-500 w-5 h-5" />
                  <span className="text-sm">I consent to my data being used for wedding planning purposes only.</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-16 pt-8 border-t">
            {step > 1 && <button type="button" onClick={prevStep} className="px-8 py-3 text-gray-600 hover:bg-gray-100 rounded-2xl">← Previous</button>}
            {step < 5 ? (
              <button type="button" onClick={nextStep} className="ml-auto px-10 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-2xl font-semibold">Continue →</button>
            ) : (
              <button type="submit" className="ml-auto px-12 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-bold text-lg rounded-2xl">Submit My RSVP 💖</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}