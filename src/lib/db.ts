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
  countryCode?: string; // Country code for mobile number (e.g., 'IN', 'US')
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
    countryCode: string; // Country code for mobile number
    mobile: string;
    email: string;
    // Travel Details
    travelMode?: string;
    pnrNumber?: string;
    ticketFile?: File | null;
    // Government ID
    govIdType?: string;
    govIdNumber?: string;
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

  // Source Indicator
  uploadSource?: 'RSVP' | 'BulkUpload';
  
  // WhatsApp Notification
  whatsappStatus?: 'Pending' | 'Success' | 'Failed' | 'Not Sent';
  whatsappSentAt?: string;
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

export interface BulkMessage {
  id: string;
  eventId: string;
  title: string;
  content: string;
  selectedFunctions: string[]; // e.g., ['Mehendi', 'Haldi']
  createdBy: string; // user id
  createdAt: string;
  sentAt?: string; // null until message is sent
  totalRecipients?: number; // count of guests who will receive this message
  recipientGuestIds?: string[]; // IDs of guests who received this message
  isAutoSent?: boolean; // Whether message was auto-sent from guest list upload
  uploadedGuestListId?: string; // Reference to uploaded guest list
}

export interface UploadedGuestList {
  id: string;
  eventId: string;
  fileName: string;
  uploadedAt: string;
  processedGuests: number;
  messagesSent: number;
  guestData: Array<{
    guestName: string;
    email?: string;
    mobile?: string;
    attendingEvents: string[]; // Events/functions they're attending
    guestId?: string; // ID if guest exists in system
  }>;
  createdBy: string;
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

/**
 * Add guests in bulk with WhatsApp messaging
 * @param guestList - List of guests to add
 * @param eventId - Event ID for WhatsApp messaging
 * @param sendWhatsApp - Whether to send WhatsApp messages
 * @returns Array of added guests
 */
export function addGuestsBulkWithWhatsApp(
  guestList: Omit<Guest, 'id' | 'submittedAt'>[],
  eventId: string,
  sendWhatsApp: boolean = true
): Guest[] {
  const guests = getGuests();
  const newGuests: Guest[] = guestList.map(g => ({
    ...g,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
    whatsappStatus: sendWhatsApp ? 'Not Sent' : undefined,
  }));
  guests.push(...newGuests);
  setItem('wedding_guests', guests);
  return newGuests;
}

/**
 * Update guest WhatsApp status
 * @param guestId - Guest ID
 * @param status - WhatsApp status
 * @param sentAt - Timestamp when message was sent
 */
export function updateGuestWhatsAppStatus(
  guestId: string,
  status: 'Pending' | 'Success' | 'Failed' | 'Not Sent',
  sentAt?: string
): void {
  const guests = getGuests();
  const guest = guests.find(g => g.id === guestId);
  if (guest) {
    guest.whatsappStatus = status;
    guest.whatsappSentAt = sentAt || new Date().toISOString();
    setItem('wedding_guests', guests);
  }
}

/**
 * Convert parsed guest data from CSV/Excel file into Guest objects
 * Maps ParsedGuestData format to Guest database format
 */
export function convertParsedGuestToGuest(
  parsedGuests: any[], // ParsedGuestData[]
  eventId: string
): Omit<Guest, 'id' | 'submittedAt'>[] {
  return parsedGuests.map((parsed) => {
    // Convert attendingEvents array to functionAttendance record
    const functionAttendance: Record<string, 'Yes' | 'No'> = {
      'Welcome Lunch': 'No',
      'Mehendi': 'No',
      'Sangeet': 'No',
      'Haldi': 'No',
      'Wedding Ceremony': 'No',
      'Reception': 'No',
      'Farewell Brunch': 'No',
    };

    // Mark events as 'Yes' if guest is attending
    if (parsed.attendingEvents && Array.isArray(parsed.attendingEvents)) {
      parsed.attendingEvents.forEach((event: string) => {
        if (functionAttendance.hasOwnProperty(event)) {
          functionAttendance[event] = 'Yes';
        }
      });
    }

    return {
      eventId,
      name: parsed.guestName || '',
      mobile: parsed.mobile || '',
      email: parsed.email || '',
      city: '',
      respondingFor: 'Self',
      attendanceStatus: 'Maybe',
      functionAttendance,
      adults: 0,
      children: 0,
      infants: 0,
      additionalGuests: [],
      needsAccommodation: false,
      needsPickup: false,
      needsDrop: false,
      transferPassengers: 0,
      transferBags: 0,
      mealPreference: '',
      dietaryRestrictions: '',
      specialAssistance: [],
      celebrationParticipation: [],
      additionalNotes: '',
      infoAccurate: true,
      dataConsent: true,
      uploadSource: 'BulkUpload',
    };
  });
}

// Bulk Message functions
export function getMessages(): BulkMessage[] {
  return getItem<BulkMessage[]>('wedding_messages', []);
}

export function getMessagesByEvent(eventId: string): BulkMessage[] {
  return getMessages().filter(m => m.eventId === eventId);
}

export function createMessage(message: Omit<BulkMessage, 'id' | 'createdAt'>): BulkMessage {
  const messages = getMessages();
  const newMessage: BulkMessage = {
    ...message,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  messages.push(newMessage);
  setItem('wedding_messages', messages);
  return newMessage;
}

export function updateMessage(id: string, updates: Partial<BulkMessage>): BulkMessage | null {
  const messages = getMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return null;
  
  messages[index] = { ...messages[index], ...updates };
  setItem('wedding_messages', messages);
  return messages[index];
}

export function sendMessage(messageId: string): BulkMessage | null {
  return updateMessage(messageId, { sentAt: new Date().toISOString() });
}

export function deleteMessage(id: string): void {
  const messages = getMessages().filter(m => m.id !== id);
  setItem('wedding_messages', messages);
}

// Get guests who will receive a message based on selected functions
export function getRecipientsForMessage(eventId: string, selectedFunctions: string[]): Guest[] {
  const guests = getGuestsByEvent(eventId);
  
  // Filter guests who are attending at least one of the selected functions
  return guests.filter(guest => {
    return selectedFunctions.some(func => guest.functionAttendance[func] === 'Yes');
  });
}

// Guest List Upload functions
export function getUploadedGuestLists(): UploadedGuestList[] {
  return getItem<UploadedGuestList[]>('wedding_uploaded_guest_lists', []);
}

export function getUploadedGuestListsByEvent(eventId: string): UploadedGuestList[] {
  return getUploadedGuestLists().filter(u => u.eventId === eventId);
}

export function createUploadedGuestList(uploadedList: Omit<UploadedGuestList, 'id'>): UploadedGuestList {
  const lists = getUploadedGuestLists();
  const newList: UploadedGuestList = {
    ...uploadedList,
    id: uuidv4(),
  };
  lists.push(newList);
  setItem('wedding_uploaded_guest_lists', lists);
  return newList;
}

export function deleteUploadedGuestList(id: string): void {
  const lists = getUploadedGuestLists().filter(u => u.id !== id);
  setItem('wedding_uploaded_guest_lists', lists);
}

// Find guest by name or email to match with uploaded list
export function findGuestByNameOrEmail(eventId: string, name: string, email?: string): Guest | undefined {
  const guests = getGuestsByEvent(eventId);
  
  // First try exact name match (case-insensitive)
  let found = guests.find(g => g.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  
  // Then try email match if provided
  if (email) {
    found = guests.find(g => g.email.toLowerCase() === email.toLowerCase());
    if (found) return found;
  }
  
  // Finally try partial name match
  const nameLower = name.toLowerCase();
  found = guests.find(g => 
    g.name.toLowerCase().includes(nameLower) || 
    nameLower.includes(g.name.toLowerCase())
  );
  
  return found;
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
