import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventById, addGuest, type WeddingEvent } from '../lib/db';
import { Heart, ArrowLeft, CheckCircle, Plus, Upload, User, ChevronDown, ChevronRight, Plane, Train, Users, Briefcase, Phone, X, File } from 'lucide-react';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, validateMobileNumber, formatMobileForDisplay, validateEmail, validateGovernmentId, formatIdForDisplay, validateFlightPNR, validateTrainPNR } from '../lib/constants';

const ID_TYPES = ['Aadhaar Card', 'Passport', 'Driving License', 'Voter ID'];
const TRAVEL_MODES = ['By Flight', 'By Train', 'Myself'];
const FUNCTIONS = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];

/** Age 1–12 inclusive → Child; above 12 → Adult. Invalid/missing age returns null. */
function guestAgeClassification(age: number): 'Child' | 'Adult' | null {
  if (!Number.isFinite(age) || age < 1) return null;
  return age <= 12 ? 'Child' : 'Adult';
}

function hasMainFlightTravelReady(fd: {
  personalTravelMode: string;
  flightPnr: string;
  flightTicket: File | null;
}): boolean {
  return (
    fd.personalTravelMode === 'By Flight' &&
    validateFlightPNR(fd.flightPnr).isValid &&
    !!fd.flightTicket
  );
}

function hasMainTrainTravelReady(fd: {
  personalTravelMode: string;
  trainPnr: string;
  trainTicket: File | null;
}): boolean {
  return (
    fd.personalTravelMode === 'By Train' &&
    validateTrainPNR(fd.trainPnr).isValid &&
    !!fd.trainTicket
  );
}

export default function RSVPForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [expandedGuests, setExpandedGuests] = useState<number[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    gender: 'Male',
    countryCode: DEFAULT_COUNTRY_CODE,
    mobile: '',
    email: '',
    city: '',
    respondingFor: 'Self' as 'Self' | 'Couple' | 'Family',
    attendanceStatus: 'Yes' as 'Yes' | 'Maybe' | 'Cannot attend',
    functionAttendance: {} as Record<string, 'Yes' | 'No'>,
    additionalGuests: [] as Array<{
      name: string;
      age: number;
      gender: 'Male' | 'Female' | 'Other';
      relation: string;
      countryCode: string;
      mobile: string;
      email: string;
      travelMode?: string;
      travelSameAsMain?: 'flight' | 'train' | null;
      ticketFile?: File | null;
      pnrNumber?: string;
      govIdType?: string;
      govIdNumber?: string;
      govIdFile?: File | null;
    }>,
    needsAccommodation: false,
    checkInDate: '',
    checkOutDate: '',
    numberOfRooms: 1,
    roomPreference: '',
    preferredRoommates: '',
    personalTravelMode: '',
    flightTicket: null as File | null,
    trainTicket: null as File | null,
    flightPnr: '',
    trainPnr: '',
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

  const [newGuest, setNewGuest] = useState<{ 
    name: string; 
    age: number; 
    gender: 'Male' | 'Female' | 'Other'; 
    relation: string;
    countryCode: string;
    mobile: string;
    email: string;
    travelMode: string;
    travelSameAsMain: 'flight' | 'train' | null;
    ticketFile: File | null;
    pnrNumber: string;
    govIdType: string;
    govIdNumber: string;
    govIdFile: File | null;
  }>({
    name: '', 
    age: 0, 
    gender: 'Male', 
    relation: '',
    countryCode: DEFAULT_COUNTRY_CODE,
    mobile: '',
    email: '',
    travelMode: '',
    travelSameAsMain: null,
    ticketFile: null,
    pnrNumber: '',
    govIdType: '',
    govIdNumber: '',
    govIdFile: null
  });

  useEffect(() => {
    if (id) {
      const ev = getEventById(id);
      if (ev) setEvent(ev);
    }
  }, [id]);

  // Truncate mobile number when country code changes
  useEffect(() => {
    const country = COUNTRY_CODES.find(c => c.code === formData.countryCode);
    if (country && formData.mobile.length > country.digitCount) {
      updateForm('mobile', formData.mobile.slice(0, country.digitCount));
    }
  }, [formData.countryCode]);

  // Keep additional-guest draft in sync when "same as main" is selected and main travel changes
  useEffect(() => {
    setNewGuest((prev) => {
      if (prev.travelSameAsMain === 'flight') {
        if (!hasMainFlightTravelReady(formData)) {
          return {
            ...prev,
            travelSameAsMain: null,
            travelMode: '',
            pnrNumber: '',
            ticketFile: null,
          };
        }
        return {
          ...prev,
          travelMode: 'By Flight',
          pnrNumber: formData.flightPnr,
          ticketFile: formData.flightTicket,
        };
      }
      if (prev.travelSameAsMain === 'train') {
        if (!hasMainTrainTravelReady(formData)) {
          return {
            ...prev,
            travelSameAsMain: null,
            travelMode: '',
            pnrNumber: '',
            ticketFile: null,
          };
        }
        return {
          ...prev,
          travelMode: 'By Train',
          pnrNumber: formData.trainPnr,
          ticketFile: formData.trainTicket,
        };
      }
      return prev;
    });
  }, [
    formData.personalTravelMode,
    formData.flightPnr,
    formData.flightTicket,
    formData.trainPnr,
    formData.trainTicket,
  ]);

  const updateForm = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Validate file type for uploads
  const validateFileType = (file: File | null): boolean => {
    if (!file) return true;
    
    const allowedTypes = [
      // Images
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/svg+xml',
      // PDF
      'application/pdf'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError(`Invalid file type. Only images (JPG, PNG, WEBP, GIF) and PDF files are allowed. You selected: ${file.type || 'unknown type'}`);
      return false;
    }
    
    // Also check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is 5MB. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return false;
    }
    
    return true;
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

  const toggleGuestExpanded = (index: number) => {
    setExpandedGuests(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const addAdditionalGuest = () => {
    if (!newGuest.name || !newGuest.relation || !newGuest.mobile || !newGuest.email) {
      setError('Please fill all guest details (Name, Relation, Mobile, Email)');
      return;
    }

    if (!Number.isFinite(newGuest.age) || newGuest.age < 1) {
      setError('Please enter a valid guest age');
      return;
    }
    
    // Validate mobile number for additional guest
    const mobileValidation = validateMobileNumber(newGuest.mobile, newGuest.countryCode);
    if (!mobileValidation.isValid) {
      setError(mobileValidation.error || 'Invalid mobile number');
      return;
    }
    
    // Validate email for additional guest
    const emailValidation = validateEmail(newGuest.email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email address');
      return;
    }

    let guestToAdd = { ...newGuest };
    if (guestToAdd.travelSameAsMain === 'flight' && hasMainFlightTravelReady(formData)) {
      Object.assign(guestToAdd, {
        travelMode: 'By Flight',
        pnrNumber: formData.flightPnr,
        ticketFile: formData.flightTicket,
        travelSameAsMain: 'flight' as const,
      });
    } else if (guestToAdd.travelSameAsMain === 'train' && hasMainTrainTravelReady(formData)) {
      Object.assign(guestToAdd, {
        travelMode: 'By Train',
        pnrNumber: formData.trainPnr,
        ticketFile: formData.trainTicket,
        travelSameAsMain: 'train' as const,
      });
    } else {
      guestToAdd.travelSameAsMain = null;
    }

    setFormData((prev) => ({
      ...prev,
      additionalGuests: [...prev.additionalGuests, guestToAdd],
    }));
    setNewGuest({ 
      name: '', 
      age: 0, 
      gender: 'Male', 
      relation: '',
      countryCode: DEFAULT_COUNTRY_CODE,
      mobile: '',
      email: '',
      travelMode: '',
      travelSameAsMain: null,
      ticketFile: null,
      pnrNumber: '',
      govIdType: '',
      govIdNumber: '',
      govIdFile: null
    });
    setError('');
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
      
      // Validate mobile number
      const mobileValidation = validateMobileNumber(formData.mobile, formData.countryCode);
      if (!mobileValidation.isValid) {
        setError(mobileValidation.error || 'Invalid mobile number');
        return false;
      }
      
      // Validate email
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid) {
        setError(emailValidation.error || 'Invalid email address');
        return false;
      }
      
      // Validate Government ID
      const idValidation = validateGovernmentId(formData.idNumber, formData.idType);
      if (!idValidation.isValid) {
        setError(idValidation.error || 'Invalid ID number');
        return false;
      }
    }
    if (step === 3) {
      const invalidAge = formData.additionalGuests.some(
        (g) => !Number.isFinite(g.age) || g.age < 1
      );
      if (invalidAge) {
        setError('Each added guest must have a valid age (Child: 1–12 years, Adult: 13+ years)');
        return false;
      }
    }
    if (step === 4) {
      if (!formData.infoAccurate || !formData.dataConsent) {
        setError('Please confirm the declaration');
        return false;
      }
    }
    setError('');
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s + 1, 4)); };
  const prevStep = () => { setStep(s => Math.max(s - 1, 1)); setError(''); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || !id) return;

    const additionalAdults = formData.additionalGuests.filter((g) => guestAgeClassification(g.age) === 'Adult').length;
    const additionalChildren = formData.additionalGuests.filter((g) => guestAgeClassification(g.age) === 'Child').length;

    addGuest({
      eventId: id,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      city: formData.city,
      respondingFor: formData.respondingFor,
      attendanceStatus: formData.attendanceStatus,
      functionAttendance: formData.functionAttendance,
      adults: 1 + additionalAdults,
      children: additionalChildren,
      infants: 0,
      additionalGuests: formData.additionalGuests,
      needsAccommodation: formData.needsAccommodation,
      checkInDate: formData.checkInDate,
      checkOutDate: formData.checkOutDate,
      numberOfRooms: formData.numberOfRooms,
      roomPreference: formData.roomPreference,
      preferredRoommates: formData.preferredRoommates,
      arrivalMode: formData.personalTravelMode,
      idType: formData.idType,
      idNumber: formData.idNumber,
      mealPreference: formData.mealPreference,
      dietaryRestrictions: formData.dietaryRestrictions,
      specialAssistance: formData.specialAssistance,
      celebrationParticipation: formData.celebrationParticipation,
      additionalNotes: formData.additionalNotes,
      infoAccurate: formData.infoAccurate,
      dataConsent: formData.dataConsent,
      needsPickup: false,
      needsDrop: false,
      transferPassengers: 0,
      transferBags: 0,
    });

    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8">
            <div className="text-center mb-12">
              <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
              <h2 className="text-4xl font-bold mb-3">Thank You! RSVP Submitted</h2>
              <p className="text-gray-600 text-lg">Your response has been successfully recorded.</p>
            </div>

            {/* Submitted Details */}
            <div className="space-y-8">
              {/* Main Guest */}
              <div className="border-b pb-8">
                <h3 className="text-2xl font-bold mb-6 text-gray-900">Main Guest Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Name</p>
                    <p className="text-lg font-semibold">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Email</p>
                    <p className="text-lg font-semibold">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Mobile</p>
                    <p className="text-lg font-semibold">{formatMobileForDisplay(formData.mobile, formData.countryCode)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">City</p>
                    <p className="text-lg font-semibold">{formData.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Gender</p>
                    <p className="text-lg font-semibold">{formData.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Attendance</p>
                    <p className={`text-lg font-semibold ${formData.attendanceStatus === 'Yes' ? 'text-green-600' : formData.attendanceStatus === 'Maybe' ? 'text-yellow-600' : 'text-red-600'}`}>{formData.attendanceStatus}</p>
                  </div>
                </div>
              </div>

              {/* Accommodation */}
              {formData.needsAccommodation && (
                <div className="border-b pb-8">
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Accommodation Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><p className="text-sm text-gray-500">Check-in</p><p className="font-semibold">{formData.checkInDate}</p></div>
                    <div><p className="text-sm text-gray-500">Check-out</p><p className="font-semibold">{formData.checkOutDate}</p></div>
                    <div><p className="text-sm text-gray-500">Rooms Needed</p><p className="font-semibold">{formData.numberOfRooms}</p></div>
                    {formData.roomPreference && <div><p className="text-sm text-gray-500">Preference</p><p className="font-semibold">{formData.roomPreference}</p></div>}
                  </div>
                </div>
              )}

              {/* Additional Guests */}
              {formData.additionalGuests.length > 0 && (
                <div className="border-b pb-8">
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">Additional Guests ({formData.additionalGuests.length})</h3>
                  <div className="space-y-4">
                    {formData.additionalGuests.map((guest, idx) => (
                      <div key={idx} className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                        <h4 className="font-bold text-lg mb-4 text-gray-900">Guest {idx + 1}: {guest.name}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div><p className="text-sm text-gray-500">Age</p><p className="font-semibold">{guest.age} years{guestAgeClassification(guest.age) ? ` (${guestAgeClassification(guest.age)})` : ''}</p></div>
                          <div><p className="text-sm text-gray-500">Gender</p><p className="font-semibold">{guest.gender}</p></div>
                          <div><p className="text-sm text-gray-500">Relation</p><p className="font-semibold">{guest.relation}</p></div>
                          <div><p className="text-sm text-gray-500">Mobile</p><p className="font-semibold">{formatMobileForDisplay(guest.mobile, guest.countryCode)}</p></div>
                          <div className="md:col-span-2"><p className="text-sm text-gray-500">Email</p><p className="font-semibold">{guest.email}</p></div>
                          {guest.travelMode && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Travel</p>
                              <p className="font-semibold">
                                {guest.travelMode}
                                {guest.pnrNumber && ` (PNR: ${guest.pnrNumber})`}
                              </p>
                              {(guest.travelSameAsMain === 'flight' || guest.travelSameAsMain === 'train') && (
                                <p className="text-xs font-medium text-blue-800 mt-1">
                                  Same {guest.travelSameAsMain === 'flight' ? 'flight' : 'train'} details as main guest
                                </p>
                              )}
                              {guest.ticketFile && (
                                <p className="text-xs text-gray-600 mt-1 truncate" title={guest.ticketFile.name}>
                                  Ticket: {guest.ticketFile.name}
                                </p>
                              )}
                            </div>
                          )}
                          {guest.govIdType && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">ID Proof</p>
                              <p className="font-semibold">{guest.govIdType}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary & Preferences */}
              <div className="border-b pb-8">
                <h3 className="text-xl font-bold mb-4 text-gray-900">Preferences</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div><p className="text-sm text-gray-500">Meal Preference</p><p className="font-semibold">{formData.mealPreference}</p></div>
                  {formData.dietaryRestrictions && <div><p className="text-sm text-gray-500">Dietary</p><p className="font-semibold">{formData.dietaryRestrictions}</p></div>}
                  {formData.specialAssistance.length > 0 && <div><p className="text-sm text-gray-500">Assistance</p><p className="font-semibold">{formData.specialAssistance.join(', ')}</p></div>}
                </div>
              </div>

              {/* Notes */}
              {formData.additionalNotes && (
                <div>
                  <h3 className="text-xl font-bold mb-4 text-gray-900">Additional Notes</h3>
                  <p className="text-gray-700 italic bg-gray-50 p-4 rounded-2xl">{formData.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => navigate('/dashboard')} className="px-10 py-3 bg-rose-600 text-white rounded-2xl font-medium hover:bg-rose-700">Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const sections = [
    { num: 1, title: "Personal Details" },
    { num: 2, title: "Attendance" },
    { num: 3, title: "Guests" },
    { num: 4, title: "Confirmation" },
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
                
                {/* Mobile Number with Country Code */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Mobile Number *</label>
                  <div className="flex gap-3">
                    <select 
                      value={formData.countryCode} 
                      onChange={e => updateForm('countryCode', e.target.value)} 
                      className="px-4 py-4 border rounded-2xl bg-white min-w-[200px]"
                    >
                      {COUNTRY_CODES.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.dialCode}
                        </option>
                      ))}
                    </select>
                    <div className="flex-1">
                      <input 
                        type="tel" 
                        value={formData.mobile} 
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                          const maxLength = COUNTRY_CODES.find(c => c.code === formData.countryCode)?.digitCount || 10;
                          // Restrict to exact digit count
                          if (value.length <= maxLength) {
                            updateForm('mobile', value);
                          }
                        }}
                        onPaste={e => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          const value = pastedText.replace(/\D/g, ''); // Only allow digits
                          const maxLength = COUNTRY_CODES.find(c => c.code === formData.countryCode)?.digitCount || 10;
                          updateForm('mobile', value.slice(0, maxLength));
                        }}
                        onBlur={() => {
                          const validation = validateMobileNumber(formData.mobile, formData.countryCode);
                          if (!validation.isValid && formData.mobile) {
                            setError(validation.error || 'Invalid mobile number');
                          } else {
                            setError('');
                          }
                        }}
                        maxLength={COUNTRY_CODES.find(c => c.code === formData.countryCode)?.digitCount}
                        placeholder={`Enter ${COUNTRY_CODES.find(c => c.code === formData.countryCode)?.digitCount} digits`}
                        className={`w-full px-5 py-4 border rounded-2xl ${
                          formData.mobile && !validateMobileNumber(formData.mobile, formData.countryCode).isValid
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : formData.mobile && validateMobileNumber(formData.mobile, formData.countryCode).isValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                            : 'focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        required 
                      />
                      {formData.mobile && (() => {
                        const validation = validateMobileNumber(formData.mobile, formData.countryCode);
                        const country = COUNTRY_CODES.find(c => c.code === formData.countryCode);
                        return (
                          <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                            {validation.isValid 
                              ? `✓ Valid ${country?.name} number` 
                              : validation.error || `Enter exactly ${country?.digitCount} digits`
                            }
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address *</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => updateForm('email', e.target.value.trim())}
                    onBlur={() => {
                      const validation = validateEmail(formData.email);
                      if (!validation.isValid && formData.email) {
                        setError(validation.error || 'Invalid email address');
                      } else {
                        setError('');
                      }
                    }}
                    placeholder="name@example.com"
                    className={`w-full px-5 py-4 border rounded-2xl ${
                      formData.email && !validateEmail(formData.email).isValid
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : formData.email && validateEmail(formData.email).isValid
                        ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                        : 'focus:border-blue-500 focus:ring-blue-200'
                    }`}
                    required 
                  />
                  {formData.email && (() => {
                    const validation = validateEmail(formData.email);
                    return (
                      <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                        {validation.isValid ? '✓ Valid email address' : validation.error}
                      </p>
                    );
                  })()}
                </div>
                
                <div className="md:col-span-2"><label className="block text-sm font-medium mb-2">City of Residence *</label>
                  <input type="text" value={formData.city} onChange={e => updateForm('city', e.target.value)} className="w-full px-5 py-4 border rounded-2xl" required /></div>
              </div>

              {/* ID Proof */}
              <div className="border border-gray-200 rounded-3xl p-8 bg-gray-50">
                <h3 className="text-xl font-semibold mb-6">Government ID Proof</h3>
                <select value={formData.idType} onChange={e => {
                  updateForm('idType', e.target.value);
                  updateForm('idNumber', ''); // Clear ID number when type changes
                }} className="w-full px-5 py-4 border rounded-2xl mb-6" required>
                  <option value="">Select ID Type</option>
                  {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>

                {formData.idType && (
                  <div className="bg-white p-6 rounded-2xl border">
                    <h4 className="font-bold text-lg mb-4">PROOF DETAILS</h4>
                    <p className="mb-4"><strong>Type:</strong> {formData.idType}</p>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2">{formData.idType} Number *</label>
                      <input 
                        type="text" 
                        value={formData.idNumber} 
                        onChange={e => {
                          let value = e.target.value.toUpperCase().replace(/\s+/g, '');
                          
                          // Apply type-specific filtering
                          if (formData.idType === 'Aadhaar Card') {
                            // Only digits, max 12
                            value = value.replace(/\D/g, '').slice(0, 12);
                          } else if (formData.idType === 'Passport') {
                            // 1 letter + up to 7 digits
                            if (value.length === 0) {
                              value = '';
                            } else if (value.length === 1) {
                              // First character must be a letter
                              value = value.replace(/[^A-Z]/g, '');
                            } else {
                              // First letter + digits only
                              const letter = value[0].replace(/[^A-Z]/g, '');
                              const digits = value.slice(1).replace(/\D/g, '').slice(0, 7);
                              value = letter + digits;
                            }
                          } else if (formData.idType === 'Driving License') {
                            // 2 letters + 13 digits
                            if (value.length === 0) {
                              value = '';
                            } else if (value.length <= 2) {
                              // First 2 characters must be letters
                              value = value.replace(/[^A-Z]/g, '').slice(0, 2);
                            } else {
                              // First 2 letters + digits only
                              const letters = value.slice(0, 2).replace(/[^A-Z]/g, '');
                              const digits = value.slice(2).replace(/\D/g, '').slice(0, 13);
                              value = letters + digits;
                            }
                          } else if (formData.idType === 'Voter ID') {
                            // 3 letters + 7 digits
                            if (value.length === 0) {
                              value = '';
                            } else if (value.length <= 3) {
                              // First 3 characters must be letters
                              value = value.replace(/[^A-Z]/g, '').slice(0, 3);
                            } else {
                              // First 3 letters + digits only
                              const letters = value.slice(0, 3).replace(/[^A-Z]/g, '');
                              const digits = value.slice(3).replace(/\D/g, '').slice(0, 7);
                              value = letters + digits;
                            }
                          }
                          
                          updateForm('idNumber', value);
                        }}
                        onPaste={e => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/\s+/g, '');
                          let value = pastedText;
                          
                          // Apply same filtering as onChange
                          if (formData.idType === 'Aadhaar Card') {
                            value = pastedText.replace(/\D/g, '').slice(0, 12);
                          } else if (formData.idType === 'Passport') {
                            const letter = pastedText[0]?.replace(/[^A-Z]/g, '') || '';
                            const digits = pastedText.slice(1).replace(/\D/g, '').slice(0, 7);
                            value = letter + digits;
                          } else if (formData.idType === 'Driving License') {
                            const letters = pastedText.slice(0, 2).replace(/[^A-Z]/g, '');
                            const digits = pastedText.slice(2).replace(/\D/g, '').slice(0, 13);
                            value = letters + digits;
                          } else if (formData.idType === 'Voter ID') {
                            const letters = pastedText.slice(0, 3).replace(/[^A-Z]/g, '');
                            const digits = pastedText.slice(3).replace(/\D/g, '').slice(0, 7);
                            value = letters + digits;
                          }
                          
                          updateForm('idNumber', value);
                        }}
                        onBlur={() => {
                          const validation = validateGovernmentId(formData.idNumber, formData.idType);
                          if (!validation.isValid && formData.idNumber) {
                            setError(validation.error || 'Invalid ID number');
                          } else {
                            setError('');
                          }
                        }}
                        maxLength={
                          formData.idType === 'Aadhaar Card' ? 12 :
                          formData.idType === 'Passport' ? 8 :
                          formData.idType === 'Driving License' ? 15 :
                          formData.idType === 'Voter ID' ? 10 :
                          50
                        }
                        placeholder={
                          formData.idType === 'Aadhaar Card' ? 'e.g., 234567890123' :
                          formData.idType === 'Passport' ? 'e.g., A1234567' :
                          formData.idType === 'Driving License' ? 'e.g., MH0120110012345' :
                          formData.idType === 'Voter ID' ? 'e.g., ABC1234567' :
                          'Enter ID Number'
                        }
                        className={`w-full px-5 py-4 border rounded-2xl ${
                          formData.idNumber && !validateGovernmentId(formData.idNumber, formData.idType).isValid
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : formData.idNumber && validateGovernmentId(formData.idNumber, formData.idType).isValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                            : 'focus:border-blue-500 focus:ring-blue-200'
                        }`}
                        required 
                      />
                      {formData.idNumber && (() => {
                        const validation = validateGovernmentId(formData.idNumber, formData.idType);
                        return (
                          <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                            {validation.isValid 
                              ? `✓ Valid ${formData.idType}` 
                              : validation.error
                            }
                          </p>
                        );
                      })()}
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Front Side Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Front Side *</label>
                        {!formData.idFront ? (
                          <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-rose-400 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm mt-2 text-gray-600">Upload Front Side</span>
                            <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF (Max 5MB)</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file && validateFileType(file)) {
                                  updateForm('idFront', file);
                                } else if (file) {
                                  e.target.value = ''; // Reset input
                                }
                              }} 
                            />
                          </label>
                        ) : (
                          <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <File className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{formData.idFront.name}</p>
                                  <p className="text-xs text-gray-500">{(formData.idFront.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateForm('idFront', null)}
                                className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Remove file"
                              >
                                <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              <span>Front side uploaded successfully</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Back Side Upload */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Back Side *</label>
                        {!formData.idBack ? (
                          <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-rose-400 transition-colors">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <span className="text-sm mt-2 text-gray-600">Upload Back Side</span>
                            <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF (Max 5MB)</span>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                if (file && validateFileType(file)) {
                                  updateForm('idBack', file);
                                } else if (file) {
                                  e.target.value = ''; // Reset input
                                }
                              }} 
                            />
                          </label>
                        ) : (
                          <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <File className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{formData.idBack.name}</p>
                                  <p className="text-xs text-gray-500">{(formData.idBack.size / 1024).toFixed(1)} KB</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => updateForm('idBack', null)}
                                className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                                title="Remove file"
                              >
                                <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              <span>Back side uploaded successfully</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Travel Details */}
              <div className="border border-blue-200 rounded-3xl p-8 bg-blue-50">
                <h3 className="text-xl font-semibold mb-6">Your Travel Details</h3>
                <label className="block text-sm font-medium mb-4">Mode of Travel</label>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {TRAVEL_MODES.map(mode => (
                    <button key={mode} type="button" onClick={() => updateForm('personalTravelMode', mode)}
                      className={`py-4 rounded-2xl border-2 font-medium transition-all ${formData.personalTravelMode === mode ? 'border-blue-500 bg-white' : 'border-gray-300 hover:border-gray-400'}`}>
                      {mode}
                    </button>
                  ))}
                </div>

                {formData.personalTravelMode === 'By Flight' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 mb-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Flight PNR Number</label>
                      <input 
                        type="text" 
                        value={formData.flightPnr} 
                        onChange={e => {
                          const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                          updateForm('flightPnr', value);
                        }}
                        maxLength={6}
                        placeholder="e.g., ABC123" 
                        className={`w-full px-5 py-4 border rounded-2xl ${
                          formData.flightPnr && !validateFlightPNR(formData.flightPnr).isValid
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : formData.flightPnr && validateFlightPNR(formData.flightPnr).isValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                            : 'focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      />
                      {formData.flightPnr && !validateFlightPNR(formData.flightPnr).isValid && (
                        <p className="text-xs text-red-600 mt-2">{validateFlightPNR(formData.flightPnr).error}</p>
                      )}
                    </div>
                    <label className="block text-sm font-medium mb-2">Upload Flight Ticket</label>
                    {!formData.flightTicket ? (
                      <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm mt-2 text-gray-600">Click to upload</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF (Max 5MB)</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && validateFileType(file)) {
                              updateForm('flightTicket', file);
                            } else if (file) {
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <File className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{formData.flightTicket.name}</p>
                              <p className="text-xs text-gray-500">{(formData.flightTicket.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateForm('flightTicket', null)}
                            className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                            title="Remove file"
                          >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>
                        <p className="text-green-600 text-sm flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Uploaded successfully
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {formData.personalTravelMode === 'By Train' && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-200">
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Train PNR Number</label>
                      <input 
                        type="text" 
                        value={formData.trainPnr} 
                        onChange={e => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          updateForm('trainPnr', value);
                        }}
                        maxLength={10}
                        placeholder="e.g., 1234567890" 
                        className={`w-full px-5 py-4 border rounded-2xl ${
                          formData.trainPnr && !validateTrainPNR(formData.trainPnr).isValid
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                            : formData.trainPnr && validateTrainPNR(formData.trainPnr).isValid
                            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                            : 'focus:border-blue-500 focus:ring-blue-200'
                        }`}
                      />
                      {formData.trainPnr && !validateTrainPNR(formData.trainPnr).isValid && (
                        <p className="text-xs text-red-600 mt-2">{validateTrainPNR(formData.trainPnr).error}</p>
                      )}
                    </div>
                    <label className="block text-sm font-medium mb-2">Upload Train Ticket</label>
                    {!formData.trainTicket ? (
                      <label className="border-2 border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm mt-2 text-gray-600">Click to upload</span>
                        <span className="text-xs text-gray-400 mt-1">JPG, PNG, WEBP, PDF (Max 5MB)</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file && validateFileType(file)) {
                              updateForm('trainTicket', file);
                            } else if (file) {
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    ) : (
                      <div className="border-2 border-green-300 bg-green-50 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                              <File className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{formData.trainTicket.name}</p>
                              <p className="text-xs text-gray-500">{(formData.trainTicket.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => updateForm('trainTicket', null)}
                            className="ml-2 p-1.5 hover:bg-red-100 rounded-lg transition-colors group"
                            title="Remove file"
                          >
                            <X className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                          </button>
                        </div>
                        <p className="text-green-600 text-sm flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Uploaded successfully
                        </p>
                      </div>
                    )}
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
                  <div className="mb-8 space-y-2 bg-gray-50 border border-gray-200 rounded-2xl p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5" /> 
                      Guests List ({formData.additionalGuests.length})
                    </h4>
                    {formData.additionalGuests.map((g, i) => (
                      <div key={i} className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                        {/* Guest Header (Clickable to expand) */}
                        <div 
                          onClick={() => toggleGuestExpanded(i)}
                          className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100"
                        >
                          <div className="flex-shrink-0">
                            {expandedGuests.includes(i) ? (
                              <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-lg">{g.name}</div>
                            <div className="text-sm text-gray-500">
                              {g.relation} • {g.age} yrs • {g.gender}
                              {guestAgeClassification(g.age) && (
                                <span className="text-rose-600 font-medium"> • {guestAgeClassification(g.age)}</span>
                              )}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeAdditionalGuest(i);
                            }}
                            className="flex-shrink-0 text-red-500 text-sm font-medium hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Guest Details (Expandable) */}
                        {expandedGuests.includes(i) && (
                          <div className="px-6 py-4 space-y-4 bg-gray-50">
                            {/* Personal Information Section */}
                            <div>
                              <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                <User className="w-4 h-4" /> Personal Information
                              </h5>
                              <div className="grid grid-cols-2 gap-3 ml-6 text-sm">
                                <div>
                                  <span className="text-gray-600">Age:</span>{' '}
                                  <span className="font-medium">{g.age} years</span>
                                  {guestAgeClassification(g.age) && (
                                    <span className="ml-2 text-rose-600 font-semibold">({guestAgeClassification(g.age)})</span>
                                  )}
                                </div>
                                <div><span className="text-gray-600">Gender:</span> <span className="font-medium">{g.gender}</span></div>
                                <div className="col-span-2"><span className="text-gray-600">Relation:</span> <span className="font-medium">{g.relation}</span></div>
                                <div className="col-span-2"><span className="text-gray-600">Mobile:</span> <span className="font-medium">{formatMobileForDisplay(g.mobile, g.countryCode)}</span></div>
                                <div className="col-span-2"><span className="text-gray-600">Email:</span> <span className="font-medium break-all">{g.email}</span></div>
                              </div>
                            </div>

                            {/* Travel Details Section */}
                            {g.travelMode && (
                              <div>
                                <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                  {g.travelMode === 'By Flight' ? <Plane className="w-4 h-4" /> : g.travelMode === 'By Train' ? <Train className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                                  Travel Details
                                </h5>
                                {(g.travelSameAsMain === 'flight' || g.travelSameAsMain === 'train') && (
                                  <p className="text-xs font-medium text-blue-800 mb-2 ml-6">
                                    Same as main guest — {g.travelSameAsMain === 'flight' ? 'flight' : 'train'} booking
                                  </p>
                                )}
                                <div className="grid grid-cols-2 gap-3 ml-6 text-sm">
                                  <div><span className="text-gray-600">Mode:</span> <span className="font-medium">{g.travelMode}</span></div>
                                  {g.pnrNumber && (
                                    <div>
                                      <span className="text-gray-600">PNR Number:</span>{' '}
                                      <span className="font-medium font-mono">{g.pnrNumber}</span>
                                    </div>
                                  )}
                                  {g.ticketFile && (
                                    <div className="col-span-2">
                                      <span className="text-gray-600">Ticket:</span>{' '}
                                      <span className="font-medium text-green-600">✓ Uploaded</span>
                                      <span className="block text-xs text-gray-500 truncate mt-0.5" title={g.ticketFile.name}>
                                        {g.ticketFile.name}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Government ID Section */}
                            {g.govIdType && (
                              <div>
                                <h5 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                                  <Briefcase className="w-4 h-4" /> Government ID
                                </h5>
                                <div className="grid grid-cols-2 gap-3 ml-6 text-sm">
                                  <div><span className="text-gray-600">ID Type:</span> <span className="font-medium">{g.govIdType}</span></div>
                                  {g.govIdFile && <div className="col-span-2"><span className="text-gray-600">Proof:</span> <span className="font-medium text-green-600">✓ Uploaded</span></div>}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="border border-dashed border-gray-300 rounded-3xl p-8">
                  <h4 className="font-semibold text-lg mb-6">Enter Guest Details</h4>
                  
                  {/* Basic Info */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-600 mb-4">Basic Information</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" placeholder="Guest Name *" value={newGuest.name} onChange={e => setNewGuest(g => ({...g, name: e.target.value}))} className="px-5 py-4 border rounded-2xl" />
                      <div>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          placeholder="Age *"
                          value={newGuest.age || ''}
                          onChange={e => {
                            const raw = e.target.value;
                            const parsed = parseInt(raw, 10);
                            setNewGuest(g => ({ ...g, age: Number.isFinite(parsed) && parsed > 0 ? parsed : 0 }));
                          }}
                          className="w-full px-5 py-4 border rounded-2xl"
                        />
                        {guestAgeClassification(newGuest.age) && (
                          <p className="text-xs mt-2 font-semibold text-rose-600">
                            Classified as {guestAgeClassification(newGuest.age)}
                          </p>
                        )}
                        {newGuest.age === 0 && (
                          <p className="text-xs mt-2 text-gray-500">Enter age to classify as Child (1–12) or Adult (13+)</p>
                        )}
                      </div>
                      <select value={newGuest.gender} onChange={e => setNewGuest(g => ({...g, gender: e.target.value as 'Male' | 'Female' | 'Other'}))} className="px-5 py-4 border rounded-2xl">
                        <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                      </select>
                      <input type="text" placeholder="Relation (Wife, Son, Friend...) *" value={newGuest.relation} onChange={e => setNewGuest(g => ({...g, relation: e.target.value}))} className="px-5 py-4 border rounded-2xl" />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-6">
                    <h5 className="text-sm font-medium text-gray-600 mb-4">Contact Information</h5>
                    
                    {/* Country Code + Mobile Number */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">Mobile Number *</label>
                      <div className="flex gap-3">
                        <select 
                          value={newGuest.countryCode} 
                          onChange={e => setNewGuest(g => ({...g, countryCode: e.target.value}))} 
                          className="px-3 py-4 border rounded-2xl bg-white text-sm min-w-[180px]"
                        >
                          {COUNTRY_CODES.map(country => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.dialCode}
                            </option>
                          ))}
                        </select>
                        <div className="flex-1">
                          <input 
                            type="tel" 
                            placeholder={`${COUNTRY_CODES.find(c => c.code === newGuest.countryCode)?.digitCount} digits`}
                            value={newGuest.mobile} 
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '');
                              const maxLength = COUNTRY_CODES.find(c => c.code === newGuest.countryCode)?.digitCount || 10;
                              if (value.length <= maxLength) {
                                setNewGuest(g => ({...g, mobile: value}));
                              }
                            }}
                            onPaste={e => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text');
                              const value = pastedText.replace(/\D/g, '');
                              const maxLength = COUNTRY_CODES.find(c => c.code === newGuest.countryCode)?.digitCount || 10;
                              setNewGuest(g => ({...g, mobile: value.slice(0, maxLength)}));
                            }}
                            maxLength={COUNTRY_CODES.find(c => c.code === newGuest.countryCode)?.digitCount}
                            className={`w-full px-5 py-4 border rounded-2xl ${
                              newGuest.mobile && !validateMobileNumber(newGuest.mobile, newGuest.countryCode).isValid
                                ? 'border-red-300 focus:border-red-500' 
                                : newGuest.mobile && validateMobileNumber(newGuest.mobile, newGuest.countryCode).isValid
                                ? 'border-green-300 focus:border-green-500'
                                : ''
                            }`}
                          />
                          {newGuest.mobile && (() => {
                            const validation = validateMobileNumber(newGuest.mobile, newGuest.countryCode);
                            return (
                              <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                                {validation.isValid ? '✓ Valid' : validation.error}
                              </p>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Email Address *</label>
                      <input 
                        type="email" 
                        placeholder="name@example.com" 
                        value={newGuest.email} 
                        onChange={e => setNewGuest(g => ({...g, email: e.target.value.trim()}))}
                        className={`w-full px-5 py-4 border rounded-2xl ${
                          newGuest.email && !validateEmail(newGuest.email).isValid
                            ? 'border-red-300 focus:border-red-500'
                            : newGuest.email && validateEmail(newGuest.email).isValid
                            ? 'border-green-300 focus:border-green-500'
                            : ''
                        }`}
                      />
                      {newGuest.email && (() => {
                        const validation = validateEmail(newGuest.email);
                        return (
                          <p className={`text-xs mt-1 font-medium ${validation.isValid ? 'text-green-600' : 'text-orange-600'}`}>
                            {validation.isValid ? '✓ Valid' : validation.error}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Travel Info */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
                    <h5 className="text-sm font-medium text-gray-600 mb-2">Travel Details (Optional)</h5>
                    <p className="text-xs text-gray-500 mb-4">
                      If they travel with you on the same booking, reuse the main guest&apos;s flight or train details from step 1.
                    </p>

                    {(hasMainFlightTravelReady(formData) || hasMainTrainTravelReady(formData)) && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Same as main guest</p>
                        <div className="flex flex-wrap gap-2">
                          {hasMainFlightTravelReady(formData) && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewGuest((g) => ({
                                  ...g,
                                  travelSameAsMain: 'flight',
                                  travelMode: 'By Flight',
                                  pnrNumber: formData.flightPnr,
                                  ticketFile: formData.flightTicket,
                                }))
                              }
                              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
                                newGuest.travelSameAsMain === 'flight'
                                  ? 'border-blue-600 bg-white text-blue-800 shadow-sm'
                                  : 'border-blue-200 bg-white/80 text-blue-700 hover:border-blue-400'
                              }`}
                            >
                              <Plane className="w-3.5 h-3.5" />
                              Same Flight Details
                            </button>
                          )}
                          {hasMainTrainTravelReady(formData) && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewGuest((g) => ({
                                  ...g,
                                  travelSameAsMain: 'train',
                                  travelMode: 'By Train',
                                  pnrNumber: formData.trainPnr,
                                  ticketFile: formData.trainTicket,
                                }))
                              }
                              className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 ${
                                newGuest.travelSameAsMain === 'train'
                                  ? 'border-blue-600 bg-white text-blue-800 shadow-sm'
                                  : 'border-blue-200 bg-white/80 text-blue-700 hover:border-blue-400'
                              }`}
                            >
                              <Train className="w-3.5 h-3.5" />
                              Same Train Details
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {newGuest.travelSameAsMain === 'flight' && hasMainFlightTravelReady(formData) && (
                      <div className="bg-white p-4 rounded-xl border border-blue-200 mb-4">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-xs font-semibold text-blue-900">Using main guest&apos;s flight</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">PNR and ticket stay in sync with step 1 until you add this guest.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewGuest((g) => ({
                                ...g,
                                travelSameAsMain: null,
                                travelMode: '',
                                pnrNumber: '',
                                ticketFile: null,
                              }))
                            }
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50"
                          >
                            Enter different travel
                          </button>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Plane className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>
                              <span className="text-gray-500">PNR:</span>{' '}
                              <span className="font-mono font-semibold">{formData.flightPnr}</span>
                            </span>
                          </div>
                          {formData.flightTicket && (
                            <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-start gap-2">
                              <File className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{formData.flightTicket.name}</p>
                                <p className="text-[10px] text-gray-500">{(formData.flightTicket.size / 1024).toFixed(1)} KB</p>
                                <p className="text-green-700 text-xs mt-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Same ticket as main guest
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {newGuest.travelSameAsMain === 'train' && hasMainTrainTravelReady(formData) && (
                      <div className="bg-white p-4 rounded-xl border border-blue-200 mb-4">
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="text-xs font-semibold text-blue-900">Using main guest&apos;s train</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">PNR and ticket stay in sync with step 1 until you add this guest.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setNewGuest((g) => ({
                                ...g,
                                travelSameAsMain: null,
                                travelMode: '',
                                pnrNumber: '',
                                ticketFile: null,
                              }))
                            }
                            className="text-xs font-medium text-rose-600 hover:text-rose-800 px-2 py-1 rounded-lg hover:bg-rose-50"
                          >
                            Enter different travel
                          </button>
                        </div>
                        <div className="grid gap-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-700">
                            <Train className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            <span>
                              <span className="text-gray-500">PNR:</span>{' '}
                              <span className="font-mono font-semibold">{formData.trainPnr}</span>
                            </span>
                          </div>
                          {formData.trainTicket && (
                            <div className="border border-green-200 bg-green-50 rounded-lg p-3 flex items-start gap-2">
                              <File className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-900 truncate">{formData.trainTicket.name}</p>
                                <p className="text-[10px] text-gray-500">{(formData.trainTicket.size / 1024).toFixed(1)} KB</p>
                                <p className="text-green-700 text-xs mt-1 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Same ticket as main guest
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!newGuest.travelSameAsMain && (
                      <>
                        <div className="mb-4">
                          <label className="block text-xs font-medium text-gray-600 mb-2">Mode of Travel</label>
                          <div className="grid grid-cols-3 gap-2">
                            {TRAVEL_MODES.map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                onClick={() =>
                                  setNewGuest((g) => {
                                    if (g.travelMode === mode && !g.travelSameAsMain) return g;
                                    return {
                                      ...g,
                                      travelSameAsMain: null,
                                      travelMode: mode,
                                      pnrNumber: '',
                                      ticketFile: null,
                                    };
                                  })
                                }
                                className={`py-2 px-3 text-sm rounded-xl border transition-all ${
                                  newGuest.travelMode === mode ? 'border-blue-500 bg-white font-medium' : 'border-gray-300 hover:border-gray-400'
                                }`}
                              >
                                {mode}
                              </button>
                            ))}
                          </div>
                        </div>

                        {newGuest.travelMode === 'By Flight' && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Flight PNR Number</label>
                            <input
                              type="text"
                              placeholder="e.g., ABC123"
                              value={newGuest.pnrNumber || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
                                setNewGuest((g) => ({ ...g, pnrNumber: value }));
                              }}
                              maxLength={6}
                              className={`w-full px-3 py-2 border rounded-lg mb-3 text-sm ${
                                newGuest.pnrNumber && !validateFlightPNR(newGuest.pnrNumber).isValid
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                  : newGuest.pnrNumber && validateFlightPNR(newGuest.pnrNumber).isValid
                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                              }`}
                            />
                            {newGuest.pnrNumber && !validateFlightPNR(newGuest.pnrNumber).isValid && (
                              <p className="text-xs text-red-600 mb-3 -mt-2">{validateFlightPNR(newGuest.pnrNumber).error}</p>
                            )}
                            <label className="block text-xs font-medium mb-2">Upload Ticket</label>
                            {!newGuest.ticketFile ? (
                              <label className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-xs mt-1 text-gray-600">Upload Ticket</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, PDF</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (file && validateFileType(file)) {
                                      setNewGuest((g) => ({ ...g, ticketFile: file }));
                                    } else if (file) {
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            ) : (
                              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{newGuest.ticketFile.name}</p>
                                      <p className="text-[10px] text-gray-500">{(newGuest.ticketFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setNewGuest((g) => ({ ...g, ticketFile: null }))}
                                    className="ml-2 p-1 hover:bg-red-100 rounded transition-colors group"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-red-600" />
                                  </button>
                                </div>
                                <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Uploaded
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {newGuest.travelMode === 'By Train' && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200">
                            <label className="block text-xs font-medium text-gray-600 mb-2">Train PNR Number</label>
                            <input
                              type="text"
                              placeholder="e.g., 1234567890"
                              value={newGuest.pnrNumber || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setNewGuest((g) => ({ ...g, pnrNumber: value }));
                              }}
                              maxLength={10}
                              className={`w-full px-3 py-2 border rounded-lg mb-3 text-sm ${
                                newGuest.pnrNumber && !validateTrainPNR(newGuest.pnrNumber).isValid
                                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                  : newGuest.pnrNumber && validateTrainPNR(newGuest.pnrNumber).isValid
                                    ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                              }`}
                            />
                            {newGuest.pnrNumber && !validateTrainPNR(newGuest.pnrNumber).isValid && (
                              <p className="text-xs text-red-600 mb-3 -mt-2">{validateTrainPNR(newGuest.pnrNumber).error}</p>
                            )}
                            <label className="block text-xs font-medium mb-2">Upload Ticket</label>
                            {!newGuest.ticketFile ? (
                              <label className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:border-blue-400 transition-colors">
                                <Upload className="w-5 h-5 text-gray-400" />
                                <span className="text-xs mt-1 text-gray-600">Upload Ticket</span>
                                <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, PDF</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    if (file && validateFileType(file)) {
                                      setNewGuest((g) => ({ ...g, ticketFile: file }));
                                    } else if (file) {
                                      e.target.value = '';
                                    }
                                  }}
                                />
                              </label>
                            ) : (
                              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <File className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-gray-900 truncate">{newGuest.ticketFile.name}</p>
                                      <p className="text-[10px] text-gray-500">{(newGuest.ticketFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setNewGuest((g) => ({ ...g, ticketFile: null }))}
                                    className="ml-2 p-1 hover:bg-red-100 rounded transition-colors group"
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3 text-gray-400 group-hover:text-red-600" />
                                  </button>
                                </div>
                                <p className="text-green-600 text-xs mt-1.5 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" /> Uploaded
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Government ID */}
                  <div className="mb-6 p-4 bg-orange-50 rounded-2xl border border-orange-200">
                    <h5 className="text-sm font-medium text-gray-600 mb-4">Government ID Proof (Optional)</h5>
                    <select value={newGuest.govIdType} onChange={e => setNewGuest(g => ({...g, govIdType: e.target.value, govIdNumber: ''}))} className="w-full px-4 py-2 border rounded-lg text-sm mb-3">
                      <option value="">Select ID Type</option>
                      {ID_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                    {newGuest.govIdType && (
                      <div>
                        <div className="mb-3">
                          <label className="block text-xs font-medium mb-2">{newGuest.govIdType} Number</label>
                          <input
                            type="text"
                            value={newGuest.govIdNumber}
                            onChange={e => {
                              let value = e.target.value.toUpperCase().replace(/\s+/g, '');
                              
                              // Apply type-specific filtering
                              if (newGuest.govIdType === 'Aadhaar Card') {
                                // Only digits, max 12
                                value = value.replace(/\D/g, '').slice(0, 12);
                              } else if (newGuest.govIdType === 'Passport') {
                                // 1 letter + up to 7 digits
                                if (value.length === 0) {
                                  value = '';
                                } else if (value.length === 1) {
                                  value = value.replace(/[^A-Z]/g, '');
                                } else {
                                  const letter = value[0].replace(/[^A-Z]/g, '');
                                  const digits = value.slice(1).replace(/\D/g, '').slice(0, 7);
                                  value = letter + digits;
                                }
                              } else if (newGuest.govIdType === 'Driving License') {
                                // 2 letters + 13 digits
                                if (value.length === 0) {
                                  value = '';
                                } else if (value.length <= 2) {
                                  value = value.replace(/[^A-Z]/g, '').slice(0, 2);
                                } else {
                                  const letters = value.slice(0, 2).replace(/[^A-Z]/g, '');
                                  const digits = value.slice(2).replace(/\D/g, '').slice(0, 13);
                                  value = letters + digits;
                                }
                              } else if (newGuest.govIdType === 'Voter ID') {
                                // 3 letters + 7 digits
                                if (value.length === 0) {
                                  value = '';
                                } else if (value.length <= 3) {
                                  value = value.replace(/[^A-Z]/g, '').slice(0, 3);
                                } else {
                                  const letters = value.slice(0, 3).replace(/[^A-Z]/g, '');
                                  const digits = value.slice(3).replace(/\D/g, '').slice(0, 7);
                                  value = letters + digits;
                                }
                              }
                              
                              setNewGuest(g => ({...g, govIdNumber: value}));
                            }}
                            onPaste={e => {
                              e.preventDefault();
                              const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/\s+/g, '');
                              let value = pastedText;
                              
                              // Apply same filtering as onChange
                              if (newGuest.govIdType === 'Aadhaar Card') {
                                value = pastedText.replace(/\D/g, '').slice(0, 12);
                              } else if (newGuest.govIdType === 'Passport') {
                                const letter = pastedText[0]?.replace(/[^A-Z]/g, '') || '';
                                const digits = pastedText.slice(1).replace(/\D/g, '').slice(0, 7);
                                value = letter + digits;
                              } else if (newGuest.govIdType === 'Driving License') {
                                const letters = pastedText.slice(0, 2).replace(/[^A-Z]/g, '');
                                const digits = pastedText.slice(2).replace(/\D/g, '').slice(0, 13);
                                value = letters + digits;
                              } else if (newGuest.govIdType === 'Voter ID') {
                                const letters = pastedText.slice(0, 3).replace(/[^A-Z]/g, '');
                                const digits = pastedText.slice(3).replace(/\D/g, '').slice(0, 7);
                                value = letters + digits;
                              }
                              
                              setNewGuest(g => ({...g, govIdNumber: value}));
                            }}
                            maxLength={
                              newGuest.govIdType === 'Aadhaar Card' ? 12 :
                              newGuest.govIdType === 'Passport' ? 8 :
                              newGuest.govIdType === 'Driving License' ? 15 :
                              newGuest.govIdType === 'Voter ID' ? 10 :
                              50
                            }
                            placeholder={
                              newGuest.govIdType === 'Aadhaar Card' ? 'e.g., 234567890123' :
                              newGuest.govIdType === 'Passport' ? 'e.g., A1234567' :
                              newGuest.govIdType === 'Driving License' ? 'e.g., MH0120110012345' :
                              newGuest.govIdType === 'Voter ID' ? 'e.g., ABC1234567' :
                              'Enter ID Number'
                            }
                            className={`w-full px-3 py-2 border rounded-lg text-sm ${
                              newGuest.govIdNumber && !validateGovernmentId(newGuest.govIdNumber, newGuest.govIdType).isValid
                                ? 'border-red-300 focus:border-red-500'
                                : newGuest.govIdNumber && validateGovernmentId(newGuest.govIdNumber, newGuest.govIdType).isValid
                                ? 'border-green-300 focus:border-green-500'
                                : ''
                            }`}
                          />
                          {newGuest.govIdNumber && (() => {
                            const validation = validateGovernmentId(newGuest.govIdNumber, newGuest.govIdType);
                            return (
                              <p className={`text-xs mt-1 font-medium ${
                                validation.isValid ? 'text-green-600' : 'text-orange-600'
                              }`}>
                                {validation.isValid ? '✓ Valid' : validation.error}
                              </p>
                            );
                          })()}
                        </div>
                        
                        {/* File Upload with Preview */}
                        <div>
                          <label className="block text-xs font-medium mb-2">Upload ID Proof</label>
                          {!newGuest.govIdFile ? (
                            <label className="border-2 border-dashed border-gray-300 rounded-lg p-3 flex flex-col items-center cursor-pointer hover:border-orange-400 transition-colors">
                              <Upload className="w-5 h-5 text-gray-400" />
                              <span className="text-xs mt-1 text-gray-600">Upload Document</span>
                              <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WEBP, PDF</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,application/pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0] || null;
                                  if (file && validateFileType(file)) {
                                    setNewGuest(g => ({...g, govIdFile: file}));
                                  } else if (file) {
                                    e.target.value = ''; // Reset input
                                  }
                                }} 
                              />
                            </label>
                          ) : (
                            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <File className="w-4 h-4 text-green-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">{newGuest.govIdFile.name}</p>
                                    <p className="text-[10px] text-gray-500">{(newGuest.govIdFile.size / 1024).toFixed(1)} KB</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setNewGuest(g => ({...g, govIdFile: null}))}
                                  className="ml-2 p-1 hover:bg-red-100 rounded transition-colors group"
                                  title="Remove file"
                                >
                                  <X className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" />
                                </button>
                              </div>
                              <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Uploaded successfully</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={addAdditionalGuest} className="w-full py-3.5 bg-gray-900 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800">
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

          {/* STEP 4: Confirmation */}
          {step === 4 && (
            <div className="max-w-lg mx-auto text-center space-y-8">
              <h2 className="text-3xl font-bold">Final Confirmation</h2>
              <div className="space-y-6 text-left">
                <label className="flex gap-4 cursor-pointer">
                  <input type="checkbox" checked={formData.infoAccurate} onChange={e => updateForm('infoAccurate', e.target.checked)} className="mt-1 accent-rose-500 w-5 h-5" />
                  <span className="text-sm">I confirm that all the information provided is accurate to the best of my knowledge.</span>
                </label>
                <label className="flex gap-4 cursor-pointer">
                  <input type="checkbox" checked={formData.dataConsent} onChange={e => updateForm('dataConsent', e.target.checked)} className="mt-1 accent-rose-500 w-5 h-5" />
                  <span className="text-sm">I consent to my data being used for wedding planning purposes only*.</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-16 pt-8 border-t">
            {step > 1 && <button type="button" onClick={prevStep} className="px-8 py-3 text-gray-600 hover:bg-gray-100 rounded-2xl">← Previous</button>}
            {step < 4 ? (
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