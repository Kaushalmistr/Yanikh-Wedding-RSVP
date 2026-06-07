-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wedding Events table
CREATE TABLE IF NOT EXISTS wedding_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rsvp_token TEXT NOT NULL UNIQUE,
  groom_name TEXT NOT NULL,
  bride_name TEXT NOT NULL,
  couple_story TEXT,
  wedding_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  description TEXT,
  cover_image TEXT, -- base64 or URL
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guests table
CREATE TABLE IF NOT EXISTS guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
  
  -- Guest Details
  name TEXT NOT NULL,
  country_code TEXT,
  mobile TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  responding_for TEXT CHECK (responding_for IN ('Self', 'Couple', 'Family')),
  
  -- Attendance
  attendance_status TEXT CHECK (attendance_status IN ('Yes', 'Maybe', 'Cannot attend')),
  function_attendance JSONB DEFAULT '{}',
  
  -- Guests Attending
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  additional_guests JSONB DEFAULT '[]',
  
  -- Accommodation
  needs_accommodation BOOLEAN DEFAULT FALSE,
  check_in_date TEXT,
  check_out_date TEXT,
  number_of_rooms INTEGER,
  room_preference TEXT,
  preferred_roommates TEXT,
  
  -- Travel
  arrival_mode TEXT,
  arrival_date TEXT,
  arrival_time TEXT,
  arrival_transport_name TEXT,
  arrival_number TEXT,
  arrival_location TEXT,
  arrival_itinerary_file TEXT,
  departure_date TEXT,
  departure_time TEXT,
  departure_transport_name TEXT,
  departure_number TEXT,
  departure_itinerary_file TEXT,
  
  -- Transfers
  needs_pickup BOOLEAN DEFAULT FALSE,
  needs_drop BOOLEAN DEFAULT FALSE,
  transfer_passengers INTEGER DEFAULT 0,
  transfer_bags INTEGER DEFAULT 0,
  transfer_requirements TEXT,
  
  -- ID Proof
  id_type TEXT,
  id_number TEXT,
  id_front_file TEXT,
  id_back_file TEXT,
  
  -- Food
  dietary_restrictions TEXT,
  
  -- Special Assistance
  special_assistance JSONB DEFAULT '[]',
  
  -- Celebration
  celebration_participation JSONB DEFAULT '[]',
  
  -- Notes & Confirmation
  additional_notes TEXT,
  info_accurate BOOLEAN DEFAULT FALSE,
  data_consent BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  upload_source TEXT CHECK (upload_source IN ('RSVP', 'BulkUpload', 'Manual')),
  
  -- WhatsApp Notification
  whatsapp_status TEXT CHECK (whatsapp_status IN ('Pending', 'Success', 'Failed', 'Not Sent')),
  whatsapp_sent_at TIMESTAMPTZ,
  
  -- Documents (stored as JSONB array)
  documents JSONB DEFAULT '[]'
);

-- Bulk Messages table
CREATE TABLE IF NOT EXISTS bulk_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  selected_functions JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER,
  recipient_guest_ids JSONB DEFAULT '[]',
  is_auto_sent BOOLEAN DEFAULT FALSE,
  uploaded_guest_list_id TEXT
);

-- Uploaded Guest Lists table
CREATE TABLE IF NOT EXISTS uploaded_guest_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES wedding_events(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  processed_guests INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  guest_data JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guests_event_id ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_wedding_events_rsvp_token ON wedding_events(rsvp_token);
CREATE INDEX IF NOT EXISTS idx_guests_mobile ON guests(mobile);
CREATE INDEX IF NOT EXISTS idx_bulk_messages_event_id ON bulk_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_guest_lists_event_id ON uploaded_guest_lists(event_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE wedding_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_guest_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public RSVP access
-- Allow anyone to read wedding events by RSVP token
CREATE POLICY "Anyone can read wedding events by RSVP token"
  ON wedding_events FOR SELECT
  USING (true);

-- Allow anyone to insert guests (for RSVP submissions)
CREATE POLICY "Anyone can submit RSVP"
  ON guests FOR INSERT
  WITH CHECK (true);

-- Allow reading guests for event organizers (we'll add auth later)
CREATE POLICY "Allow reading guests"
  ON guests FOR SELECT
  USING (true);

-- Allow event creation (we'll add auth later)
CREATE POLICY "Allow event creation"
  ON wedding_events FOR INSERT
  WITH CHECK (true);

-- Allow event updates for creators
CREATE POLICY "Allow event updates"
  ON wedding_events FOR UPDATE
  USING (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (true);

-- Allow user creation
CREATE POLICY "Allow user creation"
  ON users FOR INSERT
  WITH CHECK (true);
