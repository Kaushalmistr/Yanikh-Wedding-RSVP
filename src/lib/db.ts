import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';

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
    /** Copied from main guest flight/train at save time; optional for display. */
    travelSameAsMain?: 'flight' | 'train' | null;
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
  uploadSource?: 'RSVP' | 'BulkUpload' | 'Manual';
  
  // WhatsApp Notification
  whatsappStatus?: 'Pending' | 'Success' | 'Failed' | 'Not Sent';
  whatsappSentAt?: string;

  // Documents
  documents?: GuestDocument[];
}

export interface GuestDocument {
  id: string;
  fileName: string;
  fileType: string; // MIME type
  fileSize: number; // in bytes
  base64Data: string; // base64 encoded file data
  uploadedAt: string;
  uploadedBy?: string; // 'guest' or 'admin'
  guestId: string; // Main guest ID
  relatedGuestId?: string; // For additional guests
  description?: string;
}

export interface WeddingEvent {
  id: string;
  rsvpToken: string; // Unique token for guest RSVP link
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
  try {
    const jsonData = JSON.stringify(data);
    const sizeInMB = (new Blob([jsonData]).size / (1024 * 1024)).toFixed(2);
    console.log(`Attempting to save ${key}: ${sizeInMB} MB`);
    localStorage.setItem(key, jsonData);
    console.log(`Successfully saved ${key}`);
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('LocalStorage quota exceeded!', error);
      // Calculate current storage usage
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += localStorage.getItem(key)?.length || 0;
        }
      }
      const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Storage limit exceeded! Current usage: ${totalMB} MB. ` +
        `Please reduce the number or size of uploaded documents. ` +
        `Tip: Try uploading smaller images or fewer documents at once.`
      );
    }
    throw error;
  }
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

export function generateRSVPToken(): string {
  // Generate a URL-safe token (16 characters)
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Event functions
export function getEvents(): WeddingEvent[] {
  const events = getItem<WeddingEvent[]>('wedding_events', []);
  
  // Migration: Add rsvpToken to events that don't have one
  let hasUpdates = false;
  const migratedEvents = events.map(event => {
    if (!event.rsvpToken) {
      hasUpdates = true;
      return {
        ...event,
        rsvpToken: generateRSVPToken(),
      };
    }
    return event;
  });
  
  // Save migrated events if updates were made
  if (hasUpdates) {
    setItem('wedding_events', migratedEvents);
  }
  
  return migratedEvents;
}

export async function createEvent(event: Omit<WeddingEvent, 'id' | 'createdAt' | 'rsvpToken'>): Promise<WeddingEvent> {
  const newEvent: WeddingEvent = {
    ...event,
    id: uuidv4(),
    rsvpToken: generateRSVPToken(),
    createdAt: new Date().toISOString(),
  };

  console.log('📝 Creating event:', newEvent.groomName, '&', newEvent.brideName);
  console.log('   RSVP Token:', newEvent.rsvpToken);

  // Save to Supabase first
  try {
    console.log('☁️ Attempting to save to Supabase...');
    
    const { data, error } = await supabase
      .from('wedding_events')
      .insert({
        id: newEvent.id,
        rsvp_token: newEvent.rsvpToken,
        groom_name: newEvent.groomName,
        bride_name: newEvent.brideName,
        couple_story: newEvent.coupleStory,
        wedding_date: newEvent.weddingDate,
        venue: newEvent.venue,
        description: newEvent.description,
        cover_image: newEvent.coverImage,
        created_by: newEvent.createdBy || null,  // Allow null
        created_at: newEvent.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase save FAILED:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.error('   Error details:', error.details);
      console.error('   Error hint:', error.hint);
      console.warn('⚠️ Event will ONLY be saved to localStorage!');
      console.warn('   This means RSVP link will NOT work in incognito mode!');
    } else {
      console.log('✅ Event saved to Supabase successfully!');
      console.log('   Database record:', data);
    }
  } catch (error) {
    console.error('❌ Exception saving to Supabase:', error);
    console.warn('⚠️ Event will ONLY be saved to localStorage!');
  }

  // Also save to localStorage for backward compatibility
  const events = getEvents();
  events.push(newEvent);
  setItem('wedding_events', events);
  console.log('✓ Event saved to localStorage');
  
  return newEvent;
}

export function getEventById(id: string): WeddingEvent | undefined {
  return getEvents().find(e => e.id === id);
}

export async function getEventByRSVPToken(token: string): Promise<WeddingEvent | null> {
  console.log('Looking up RSVP token:', token);
  
  try {
    // Query Supabase first (for cross-session access)
    const { data, error } = await supabase
      .from('wedding_events')
      .select('*')
      .eq('rsvp_token', token)
      .maybeSingle(); // Use maybeSingle() instead of single() to avoid error when no rows

    if (error) {
      console.error('Supabase query error:', error);
      console.log('Falling back to localStorage...');
      // Fallback to localStorage
      const localEvent = getEvents().find(e => e.rsvpToken === token);
      if (localEvent) {
        console.log('✓ Found event in localStorage:', localEvent.groomName, '&', localEvent.brideName);
      } else {
        console.log('✗ Event not found in localStorage either');
      }
      return localEvent || null;
    }

    if (data) {
      console.log('✓ Found event in Supabase:', data.groom_name, '&', data.bride_name);
      // Convert snake_case from DB to camelCase for frontend
      return {
        id: data.id,
        rsvpToken: data.rsvp_token,
        groomName: data.groom_name,
        brideName: data.bride_name,
        coupleStory: data.couple_story || '',
        weddingDate: data.wedding_date,
        venue: data.venue,
        description: data.description || '',
        coverImage: data.cover_image || '',
        createdBy: data.created_by,
        createdAt: data.created_at,
      };
    }

    // No data found in Supabase, check localStorage
    console.log('Event not in Supabase, checking localStorage...');
    const localEvent = getEvents().find(e => e.rsvpToken === token);
    if (localEvent) {
      console.log('✓ Found event in localStorage:', localEvent.groomName, '&', localEvent.brideName);
    } else {
      console.log('✗ Event not found in localStorage either');
    }
    return localEvent || null;
  } catch (error) {
    console.error('Error fetching event by token:', error);
    // Fallback to localStorage
    console.log('Exception occurred, falling back to localStorage...');
    const localEvent = getEvents().find(e => e.rsvpToken === token);
    if (localEvent) {
      console.log('✓ Found event in localStorage:', localEvent.groomName, '&', localEvent.brideName);
    } else {
      console.log('✗ Event not found anywhere');
    }
    return localEvent || null;
  }
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

export async function addGuest(guest: Omit<Guest, 'id' | 'submittedAt'>): Promise<Guest> {
  const newGuest: Guest = {
    ...guest,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
  };
  
  console.log('📝 Adding guest:', newGuest.name);
  
  // Log document info before saving
  if (newGuest.documents && newGuest.documents.length > 0) {
    const totalDocSize = newGuest.documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    console.log(`   Documents: ${newGuest.documents.length} files, ${(totalDocSize / (1024 * 1024)).toFixed(2)} MB`);
  }

  // Save to Supabase first
  try {
    console.log('☁️ Attempting to save guest to Supabase...');
    
    const { data, error } = await supabase
      .from('guests')
      .insert({
        id: newGuest.id,
        event_id: newGuest.eventId,
        name: newGuest.name,
        country_code: newGuest.countryCode,
        mobile: newGuest.mobile,
        email: newGuest.email,
        city: newGuest.city,
        responding_for: newGuest.respondingFor,
        attendance_status: newGuest.attendanceStatus,
        function_attendance: newGuest.functionAttendance || {},
        adults: newGuest.adults,
        children: newGuest.children,
        infants: newGuest.infants,
        additional_guests: newGuest.additionalGuests || [],
        needs_accommodation: newGuest.needsAccommodation || false,
        check_in_date: newGuest.checkInDate || null,
        check_out_date: newGuest.checkOutDate || null,
        number_of_rooms: newGuest.numberOfRooms || null,
        room_preference: newGuest.roomPreference || null,
        preferred_roommates: newGuest.preferredRoommates || null,
        arrival_mode: newGuest.arrivalMode || null,
        arrival_date: newGuest.arrivalDate || null,
        arrival_time: newGuest.arrivalTime || null,
        arrival_transport_name: newGuest.arrivalTransportName || null,
        arrival_number: newGuest.arrivalNumber || null,
        arrival_location: newGuest.arrivalLocation || null,
        arrival_itinerary_file: newGuest.arrivalItineraryFile || null,
        departure_date: newGuest.departureDate || null,
        departure_time: newGuest.departureTime || null,
        departure_transport_name: newGuest.departureTransportName || null,
        departure_number: newGuest.departureNumber || null,
        departure_itinerary_file: newGuest.departureItineraryFile || null,
        needs_pickup: newGuest.needsPickup || false,
        needs_drop: newGuest.needsDrop || false,
        transfer_passengers: newGuest.transferPassengers || 0,
        transfer_bags: newGuest.transferBags || 0,
        transfer_requirements: newGuest.transferRequirements || null,
        id_type: newGuest.idType || null,
        id_number: newGuest.idNumber || null,
        id_front_file: newGuest.idFrontFile || null,
        id_back_file: newGuest.idBackFile || null,
        dietary_restrictions: newGuest.dietaryRestrictions || '',
        special_assistance: newGuest.specialAssistance || [],
        celebration_participation: newGuest.celebrationParticipation || [],
        additional_notes: newGuest.additionalNotes || '',
        info_accurate: newGuest.infoAccurate || false,
        data_consent: newGuest.dataConsent || false,
        submitted_at: newGuest.submittedAt,
        upload_source: newGuest.uploadSource || null,
        whatsapp_status: newGuest.whatsappStatus || null,
        whatsapp_sent_at: newGuest.whatsappSentAt || null,
        documents: newGuest.documents || [],
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase save FAILED:', error);
      console.error('   Error code:', error.code);
      console.error('   Error message:', error.message);
      console.warn('⚠️ Guest will ONLY be saved to localStorage!');
    } else {
      console.log('✅ Guest saved to Supabase successfully!');
      console.log('   Database record ID:', data?.id);
    }
  } catch (error) {
    console.error('❌ Exception adding guest to Supabase:', error);
    console.warn('⚠️ Guest will ONLY be saved to localStorage!');
  }
  
  // Also save to localStorage for backward compatibility
  const guests = getGuests();
  guests.push(newGuest);
  setItem('wedding_guests', guests);
  console.log('✓ Guest saved to localStorage');
  
  return newGuest;
}

export function updateGuest(id: string, updates: Partial<Guest>): Guest | null {
  const guests = getGuests();
  const index = guests.findIndex((g) => g.id === id);
  if (index === -1) return null;

  guests[index] = { ...guests[index], ...updates };
  
  // Log document info if updating documents
  if (updates.documents) {
    const totalDocSize = updates.documents.reduce((sum, doc) => sum + doc.fileSize, 0);
    console.log(`Updating guest with ${updates.documents.length} documents, total size: ${(totalDocSize / (1024 * 1024)).toFixed(2)} MB`);
  }
  
  setItem('wedding_guests', guests);
  return guests[index];
}

export function deleteGuest(id: string): void {
  const guests = getGuests().filter((g) => g.id !== id);
  setItem('wedding_guests', guests);
}

export function deleteGuests(ids: string[]): void {
  if (ids.length === 0) return;
  const idSet = new Set(ids);
  const guests = getGuests().filter((g) => !idSet.has(g.id));
  setItem('wedding_guests', guests);
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
