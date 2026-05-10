import { v4 as uuidv4 } from 'uuid';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}

export interface Guest {
  id: string;
  eventId: string;
  
  // Guest Details
  name: string;
  mobile: string;
  email: string;
  city: string;
  respondingFor: 'Self' | 'Couple' | 'Family';
  
  // Attendance
  attendanceStatus: 'Yes' | 'Maybe' | 'Cannot attend';
  functionAttendance: Record<string, 'Yes' | 'No'>;
  
  // Guests Attending
  adults: number;
  children: number;
  infants: number;
  additionalGuests: Array<{
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    relation: string;
    mobile: string;
    email: string;
    // Travel Details
    travelMode?: string;
    pnrNumber?: string;
    ticketFile?: File | null;
    // Government ID
    govIdType?: string;
    govIdFile?: File | null;
  }>;
  
  // Accommodation
  needsAccommodation: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfRooms?: number;
  roomPreference?: string;
  preferredRoommates?: string;
  
  // Travel
  arrivalMode?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  arrivalTransportName?: string;
  arrivalNumber?: string;
  arrivalLocation?: string;
  arrivalItineraryFile?: string;
  
  departureDate?: string;
  departureTime?: string;
  departureTransportName?: string;
  departureNumber?: string;
  departureItineraryFile?: string;
  
  // Transfers
  needsPickup: boolean;
  needsDrop: boolean;
  transferPassengers: number;
  transferBags: number;
  transferRequirements?: string;
  
  // ID Proof
  idType?: string;
  idNumber?: string;
  idFrontFile?: string;
  idBackFile?: string;
  
  // Food
  mealPreference: string;
  dietaryRestrictions: string;
  
  // Special Assistance
  specialAssistance: string[];
  
  // Celebration
  celebrationParticipation: string[];
  
  // Notes & Confirmation
  additionalNotes: string;
  infoAccurate: boolean;
  dataConsent: boolean;
  
  submittedAt: string;
}

export interface WeddingEvent {
  id: string;
  groomName: string;
  brideName: string;
  coupleStory: string;
  weddingDate: string;
  venue: string;
  description: string;
  coverImage: string; // base64 or URL
  createdBy: string; // user id
  createdAt: string;
}

// Helper functions
function getItem<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// User functions
export function getUsers(): User[] {
  return getItem<User[]>('wedding_users', []);
}

export function createUser(name: string, email: string, mobile: string): User {
  const users = getUsers();
  const existing = users.find(u => u.mobile === mobile);
  if (existing) throw new Error('User with this mobile number already exists');
  
  const user: User = {
    id: uuidv4(),
    name,
    email,
    mobile,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  setItem('wedding_users', users);
  return user;
}

export function findUserByMobile(mobile: string): User | undefined {
  return getUsers().find(u => u.mobile === mobile);
}

export function generateOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Event functions
export function getEvents(): WeddingEvent[] {
  return getItem<WeddingEvent[]>('wedding_events', []);
}

export function createEvent(event: Omit<WeddingEvent, 'id' | 'createdAt'>): WeddingEvent {
  const events = getEvents();
  const newEvent: WeddingEvent = {
    ...event,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  setItem('wedding_events', events);
  return newEvent;
}

export function getEventById(id: string): WeddingEvent | undefined {
  return getEvents().find(e => e.id === id);
}

export function searchEvents(query: string): WeddingEvent[] {
  const lower = query.toLowerCase();
  return getEvents().filter(
    e =>
      e.groomName.toLowerCase().includes(lower) ||
      e.brideName.toLowerCase().includes(lower) ||
      e.venue.toLowerCase().includes(lower)
  );
}

export function deleteEvent(id: string): void {
  const events = getEvents().filter(e => e.id !== id);
  setItem('wedding_events', events);
  // Also delete associated guests
  const guests = getGuests().filter(g => g.eventId !== id);
  setItem('wedding_guests', guests);
}

// Guest / RSVP functions
export function getGuests(): Guest[] {
  return getItem<Guest[]>('wedding_guests', []);
}

export function getGuestsByEvent(eventId: string): Guest[] {
  return getGuests().filter(g => g.eventId === eventId);
}

export function addGuest(guest: Omit<Guest, 'id' | 'submittedAt'>): Guest {
  const guests = getGuests();
  const newGuest: Guest = {
    ...guest,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
  };
  guests.push(newGuest);
  setItem('wedding_guests', guests);
  return newGuest;
}

export function addGuestsBulk(guestList: Omit<Guest, 'id' | 'submittedAt'>[]): Guest[] {
  const guests = getGuests();
  const newGuests: Guest[] = guestList.map(g => ({
    ...g,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
  }));
  guests.push(...newGuests);
  setItem('wedding_guests', guests);
  return newGuests;
}

// Auth session
export function setSession(user: User): void {
  sessionStorage.setItem('wedding_session', JSON.stringify(user));
}

export function getSession(): User | null {
  try {
    const data = sessionStorage.getItem('wedding_session');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  sessionStorage.removeItem('wedding_session');
}
