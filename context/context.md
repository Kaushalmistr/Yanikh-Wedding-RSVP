# Wedding RSVP Management System - Project Context

## Project Overview

**Project Name:** Yanikh Wedding RSVP  
**Purpose:** A comprehensive wedding event management and RSVP tracking system that allows couples to create wedding events, collect RSVPs, manage guest information, track attendance details, send bulk WhatsApp messages, and manage document uploads from guests.

**Live Demo:** https://withJoy.com/nanki-and-yuvraj-khanna/edit/cards/wedding/save-the-date

---

## Key Features

✅ **Event Management** - Create and manage multiple wedding events  
✅ **Guest RSVP Tracking** - Multi-step RSVP form with comprehensive guest details  
✅ **Document Management** - Upload, download, and manage guest documents (ID proofs, tickets, etc.)  
✅ **WhatsApp Integration** - Send bulk WhatsApp messages via WhatsApp Business Cloud API  
✅ **Guest List Management** - View, filter, and export guest information  
✅ **Bulk Messaging** - Send auto-generated or custom messages to multiple guests  
✅ **Excel Export** - Export guest data to Excel format  
✅ **Authentication** - Secure login system for event organizers  
✅ **Country Code Support** - International phone number support with country flags  

---

## Technology Stack

### Frontend
- **Framework:** React 19 with TypeScript
- **Build Tool:** Vite 7
- **Routing:** React Router DOM v7
- **Styling:** Tailwind CSS 4
- **State Management:** React Context API (AuthContext)
- **Icons:** Lucide React
- **Spreadsheet Export:** XLSX (SheetJS)
- **UUID Generation:** uuid
- **Country Code Dropdown:** react-select with react-country-flag
- **Class Utilities:** clsx + tailwind-merge

### Backend/Storage
- **Database:** localStorage (Client-side) + Supabase (Backend)
- **Authentication:** Custom localStorage-based auth with Supabase integration
- **Data Persistence:** JSON serialization in localStorage and Supabase
- **WhatsApp API:** Meta WhatsApp Business Cloud API v21.0
- **Secure Proxy:** Supabase Edge Functions for API token management

### External Services
- **Supabase** - Backend-as-a-Service with Edge Functions
- **WhatsApp Business API** - For sending bulk messages via Meta Graph API
- **Meta Business Platform** - WhatsApp integration provider

### Development
- **Package Manager:** npm
- **Node Version:** v18 or higher
- **TypeScript:** 5.9
- **Config:** tsconfig.json for TypeScript, vite.config.ts for build
- **Single-File Build:** vite-plugin-singlefile for easy deployment

---

## Project Structure

```
Yanikh-Wedding-RSVP/
├── src/
│   ├── App.tsx                 # Main app with HashRouter routing
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles (incl. column filter animations)
│   ├── components/
│   │   ├── ColumnFilterHeader.tsx  # Reusable column filter/sort dropdown
│   │   ├── CountryCodeSelect.tsx   # Country code selector (react-select)
│   │   ├── CountryFlag.tsx         # Country flag display component
│   │   └── DocumentsModal.tsx      # Document upload/preview/download modal
│   ├── context/
│   │   └── AuthContext.tsx                  # Authentication state management
│   ├── lib/
│   │   ├── constants.ts         # App-wide constants, country codes, validation
│   │   ├── db.ts                # Database layer (localStorage CRUD)
│   │   ├── documentService.ts   # Document upload, validation, download utils
│   │   ├── guestListParser.ts   # Excel/CSV file parsing and event detection
│   │   ├── guestUploadService.ts # Bulk guest upload with WhatsApp integration
│   │   ├── seedData.ts          # Dummy data seeding for development
│   │   ├── supabase.ts          # Placeholder for Supabase
│   │   └── whatsappService.ts   # WhatsApp messaging (mock implementation)
│   ├── pages/
│   │   ├── AuthPage.tsx         # Login/Signup page
│   │   ├── Dashboard.tsx        # Events list & management
│   │   ├── CreateEvent.tsx      # Create new wedding event
│   │   ├── EventDetail.tsx      # Event details & guest list view
│   │   ├── GuestList.tsx        # Full guest list with CRUD, filters, documents
│   │   ├── RSVPForm.tsx         # Multi-step RSVP form with document upload
│   │   └── BulkMessaging.tsx    # Bulk messaging & auto-send features
│   ├── utils/
│   │   ├── cn.ts                # Tailwind class utilities
│   │   └── CountryCodeSelect.tsx # Legacy country code selector
├── context/
│   └── context.md               # Project context documentation
├── public/
│   └── images/                  # Static assets
├── index.html                   # HTML entry point
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── package.json                 # Dependencies
├── DOCUMENT_MANAGEMENT_GUIDE.md           # Document management quick start guide
├── DOCUMENT_MANAGEMENT_IMPLEMENTATION.md  # Document management implementation details
├── DUMMY_DATA_GUIDE.md                    # Dummy data seeding guide
├── WHATSAPP_INTEGRATION.md                # WhatsApp integration guide
└── README.md                    # Project documentation
```

---

## Core Data Models

### User Interface
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  createdAt: string;
}
```

### Wedding Event
```typescript
interface WeddingEvent {
  id: string;
  groomName: string;
  brideName: string;
  coupleStory: string;
  weddingDate: string;
  venue: string;
  description: string;
  coverImage: string;      // base64 or URL
  createdBy: string;       // user id
  createdAt: string;
}
```

### Guest Document
```typescript
interface GuestDocument {
  id: string;
  fileName: string;          // Original file name
  fileType: string;          // MIME type (e.g., 'image/jpeg', 'application/pdf')
  fileSize: number;          // File size in bytes
  base64Data: string;        // Base64-encoded file content
  uploadedAt: string;        // ISO timestamp
  uploadedBy: 'guest' | 'admin';
  guestId: string;           // Guest who uploaded the document
  relatedGuestId?: string;   // Reference to related guest (optional)
  description?: string;      // Document type (e.g., 'Flight Ticket', 'Aadhaar Card - Front')
}
```

### Guest RSVP Response
```typescript
interface Guest {
  id: string;
  eventId: string;
  
  // Personal Details
  name: string;
  countryCode?: string;      // ISO country code (e.g., 'IN', 'US', 'GB')
  mobile: string;            // Mobile number (digits only, validated per country)
  email: string;             // Validated email format
  city: string;
  respondingFor: 'Self' | 'Couple' | 'Family';
  
  // Attendance
  attendanceStatus: 'Yes' | 'Maybe' | 'Cannot attend';
  functionAttendance: Record<string, 'Yes' | 'No'>;
  
  // Guest Counts
  adults: number;
  children: number;
  infants: number;
  additionalGuests: Array<{
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    relation: string;
    countryCode: string;     // ISO country code
    mobile: string;          // Validated per country
    email: string;           // Validated email format
    // Travel Details for each guest
    travelMode?: string;
    travelSameAsMain?: 'flight' | 'train' | null;
    pnrNumber?: string;      // Flight: 6 alphanumeric, Train: 10 digits
    ticketFile?: File | null;
    // Government ID Proof for each guest
    govIdType?: string;      // 'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID'
    govIdNumber?: string;    // Validated per ID type
    govIdFile?: File | null;
  }>;
  
  // Accommodation
  needsAccommodation: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfRooms?: number;
  roomPreference?: string;
  preferredRoommates?: string;
  
  // Travel (Arrival)
  arrivalMode?: string;
  arrivalDate?: string;
  arrivalTime?: string;
  arrivalTransportName?: string;
  arrivalNumber?: string;
  arrivalLocation?: string;
  arrivalItineraryFile?: string;
  
  // Travel (Departure)
  departureDate?: string;
  departureTime?: string;
  departureTransportName?: string;
  departureNumber?: string;
  departureItineraryFile?: string;
  
  // Airport/Station Transfers
  needsPickup: boolean;
  needsDrop: boolean;
  transferPassengers: number;
  transferBags: number;
  transferRequirements?: string;
  
  // ID Proof (Main Guest) - Validated per type
  idType?: string;           // 'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID'
  idNumber?: string;         // Format validated based on idType
  idFrontFile?: string;      // base64 encoded file data
  idBackFile?: string;       // base64 encoded file data
  
  // Documents Uploaded with RSVP
  documents?: GuestDocument[]; // All uploaded documents (ID, tickets, etc.)
  
  // Food & Preferences
  mealPreference: string;
  dietaryRestrictions: string;
  specialAssistance: string[];
  celebrationParticipation: string[];
  
  // Metadata
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
```

### Guest Document
```typescript
interface GuestDocument {
  id: string;
  fileName: string;
  fileType: string;          // MIME type
  fileSize: number;          // in bytes
  base64Data: string;        // base64 encoded file data
  uploadedAt: string;
  uploadedBy?: string;       // 'guest' or 'admin'
  guestId: string;           // Main guest ID
  relatedGuestId?: string;   // For additional guests
  description?: string;
}
```

### Bulk Message
```typescript
interface BulkMessage {
  id: string;
  eventId: string;
  title: string;                    // Message subject/title
  content: string;                  // Full message content
  selectedFunctions: string[];      // e.g., ['Mehendi', 'Haldi', 'Wedding Ceremony']
  createdBy: string;               // Admin/creator user id
  createdAt: string;               // When message was created
  sentAt?: string;                 // When message was sent (null if draft)
  totalRecipients?: number;        // Count of guests receiving this message
  recipientGuestIds?: string[];    // IDs of guests who received this message
  isAutoSent?: boolean;            // Whether message was auto-sent from guest list upload
  uploadedGuestListId?: string;    // Reference to uploaded guest list
}
```

### Uploaded Guest List
```typescript
interface UploadedGuestList {
  id: string;
  eventId: string;
  fileName: string;                // Name of uploaded file
  uploadedAt: string;              // When file was uploaded
  processedGuests: number;         // Total guests processed
  messagesSent: number;            // Total messages sent
  guestData: Array<{
    guestName: string;             // Guest's name
    email?: string;                // Guest's email (optional)
    mobile?: string;               // Guest's mobile (optional)
    attendingEvents: string[];     // Events/functions they're attending
    guestId?: string;              // ID if guest matched in system
  }>;
  createdBy: string;              // Who uploaded the list
}
```

---

## Design Patterns Used

### 1. **Context API Pattern** (State Management)
- **File:** `src/context/AuthContext.tsx`
- **Usage:** Manages authentication state globally
- **Pattern:** Provider wrapper with custom hook `useAuth()`
- **Avoids:** Prop drilling for auth state

### 2. **Repository Pattern** (Data Access Layer)
- **File:** `src/lib/db.ts`
- **Usage:** Abstracts localStorage operations
- **Functions:**
  - `createUser()`, `findUserByMobile()`, `getUsers()`
  - `createEvent()`, `getEventById()`, `getEvents()`, `deleteEvent()`, `searchEvents()`
  - `addGuest()`, `updateGuest()`, `deleteGuest()`, `deleteGuests()`, `getGuestsByEvent()`, `getGuests()`
  - `addGuestsBulk()`, `addGuestsBulkWithWhatsApp()`, `convertParsedGuestToGuest()`
  - `updateGuestWhatsAppStatus()`
  - `createMessage()`, `updateMessage()`, `sendMessage()`, `deleteMessage()`
  - `getRecipientsForMessage()`
  - `findGuestByNameOrEmail()`
  - `setSession()`, `getSession()`, `clearSession()`
- **Benefits:** Easy to switch from localStorage to real backend

### 3. **Protected Route Pattern** (Routing)
- **File:** `src/App.tsx`
- **Implementation:** `<ProtectedRoute>` and `<PublicRoute>` components
- **Usage:** Restricts access to authenticated pages
- **Flow:** Redirects unauthenticated users to login

### 4. **Multi-Step Form Pattern** (RSVPForm)
- **File:** `src/pages/RSVPForm.tsx`
- **Steps:** 4 sequential steps with validation
  - **Step 1:** Personal Details & Travel Information
    - Basic info (name, gender, mobile, email, city)
    - Government ID proof (front & back)
    - Travel details (flight/train with PNR, or driving yourself)
  - **Step 2:** Attendance & Functions
    - Overall attendance status (Yes/Maybe/Cannot attend)
    - Select which functions to attend
  - **Step 3:** Additional Guests
    - Add multiple guests with hierarchical tree display
    - Each guest: basic info, travel details, government ID proof
    - Guest details shown in expandable tree format
    - Accommodation selection
  - **Step 4:** Final Confirmation
    - **Document upload** (optional, images + PDF, max 10MB)
    - Data accuracy confirmation
    - Privacy & consent checkboxes
- **Pattern:** Step state + form data state + expandedGuests state (for tree view)
- **Validation:** Per-step validation before progression
- **Display:** Guests shown in hierarchical tree format with expandable sections

### 5. **Column Filter/Sort Pattern** (GuestList)
- **File:** `src/components/ColumnFilterHeader.tsx`
- **Usage:** Reusable dropdown for each table column header
- **Features:**
  - Filter by unique values in each column
  - Search within filter values
  - Select All / Deselect All
  - Sort ascending / descending per column
  - Visual indicators for active filters (rose dot) and sort state
  - Click outside to dismiss dropdown
  - Clear filter action

### 6. **Document Management Pattern** (DocumentsModal)
- **File:** `src/components/DocumentsModal.tsx`
- **Usage:** Full modal for managing guest documents
- **Features:**
  - Grid and list view toggle
  - Upload multiple files with validation
  - Select/deselect documents (individual and bulk)
  - Download selected or all documents
  - Delete selected documents with confirmation
  - Image preview modal
  - File size formatting and file type icons

### 7. **Component Composition Pattern**
- Feature cards in EventDetail that toggle views
- Modal-based guest detail display
- Conditional rendering for different states
- Reusable components in `src/components/` directory

---

## Application Flow

### Authentication Flow
```
User Access
    ↓
App.tsx checks AuthContext
    ↓
Is Authenticated?
    ├─ YES → Show Dashboard
    └─ NO → Show AuthPage (Login/Signup)
           ↓
           User submits credentials
           ↓
           AuthContext validates & stores in localStorage
           ↓
           Navigate to Dashboard
```

### Event Creation Flow
```
Dashboard
    ↓
Click "Create Event" button
    ↓
Navigate to CreateEvent page
    ↓
Fill Event Details (names, date, venue, story, cover image)
    ↓
Click "Create"
    ↓
addEvent() saves to localStorage
    ↓
Navigate back to Dashboard
    ↓
New event appears in events list
```

### Event Details & RSVP Flow
```
Dashboard → Click "View Event & RSVPs"
    ↓
EventDetail page loads
    ↓
Display Feature Cards Grid:
├─ Website
├─ Registry
├─ Guests Stays
├─ Collect Contacts
├─ Schedule
├─ Guest List  ← Shows guest table when clicked
├─ Save the Dates
├─ Invitations
├─ Stationery
├─ RSVP         ← Opens RSVPForm when clicked
├─ Photo Moments
└─ Messaging    ← Opens BulkMessaging when clicked
```

### RSVP Form Flow (4 Steps)
```
RSVP Button Click
    ↓
Step 1: Personal Details & Travel Information
├─ Personal Info:
│  ├─ Name (required)
│  ├─ Gender (Male/Female/Other)
│  ├─ Country Code Selector (14 countries with flags)
│  │  └─ Validates mobile per country:
│  │     ├─ India: 10 digits
│  │     ├─ US/Canada: 10 digits
│  │     ├─ UK: 10 digits
│  │     ├─ Australia/UAE/NZ/SA: 9 digits
│  │     ├─ Singapore: 8 digits
│  │     ├─ Germany: 11 digits
│  │     └─ France/Spain: 9 digits
│  ├─ Mobile Number (country-specific validation)
│  │  ├─ Real-time digit-only filtering
│  │  ├─ Auto-truncate when country changes
│  │  ├─ Visual feedback: green (valid), red (invalid)
│  │  └─ Error message if invalid
│  ├─ Email Address (validated format)
│  │  ├─ Proper format check (name@domain.com)
│  │  ├─ Domain validation
│  │  ├─ No consecutive/leading/trailing dots
│  │  └─ Visual feedback on validation
│  ├─ City of Residence
│  ├─ Government ID Proof:
│  │  ├─ ID Type Selector (Aadhaar/Passport/DL/Voter ID)
│  │  ├─ ID Number (format validated per type):
│  │  │  ├─ Aadhaar: 12 digits, no 0/1 start
│  │  │  ├─ Passport: 1 letter + 7 digits
│  │  │  ├─ Driving License: 2 letters + 13 digits
│  │  │  └─ Voter ID: 3 letters + 7 digits
│  │  └─ Upload Front/Back Images:
│  │     ├─ File type validation (Images + PDF only)
│  │     ├─ Max 5MB size check
│  │     ├─ Upload success preview:
│  │     │  ├─ File icon with name
│  │     │  ├─ File size display
│  │     │  ├─ Success checkmark
│  │     │  └─ Remove button
│  │     └─ Error if invalid type/size
├─ Travel Details:
│  ├─ Mode of Travel (By Flight / By Train / Myself)
│  ├─ If Flight:
│  │  ├─ Flight PNR Number (6 alphanumeric):
│  │  │  ├─ Real-time uppercase conversion
│  │  │  ├─ Character filtering (alphanumeric only)
│  │  │  ├─ Max 6 characters enforced
│  │  │  └─ Visual validation feedback
│  │  └─ Upload Flight Ticket:
│  │     ├─ File validation (Images + PDF, 5MB max)
│  │     └─ Upload preview with file details
│  └─ If Train:
│     ├─ Train PNR Number (10 digits):
│     │  ├─ Real-time digit filtering
│     │  ├─ Max 10 digits enforced
│     │  └─ Visual validation feedback
│     └─ Upload Train Ticket:
│        ├─ File validation (Images + PDF, 5MB max)
│        └─ Upload preview with file details
    ↓
Step 2: Attendance & Functions
├─ Main attendance status (Yes/Maybe/Cannot attend)
├─ Function-wise attendance (Welcome Lunch, Mehendi, Sangeet, Haldi, Wedding Ceremony, Reception, Farewell Brunch)
    ↓
Step 3: Add Guests (Hierarchical Tree Format)
├─ List main guest (auto-counted)
├─ Add additional guests with:
│  ├─ Basic info (Name, Age, Gender, Relation)
│  ├─ Contact:
│  │  ├─ Country Code (same validation as main)
│  │  ├─ Mobile (validated per country)
│  │  └─ Email (format validated)
│  ├─ Travel Details:
│  │  ├─ Mode (By Flight / By Train / Myself)
│  │  ├─ Flight:
│  │  │  ├─ PNR (6 alphanumeric, validated)
│  │  │  └─ Ticket Upload (validated)
│  │  └─ Train:
│  │     ├─ PNR (10 digits, validated)
│  │     └─ Ticket Upload (validated)
│  └─ Government ID Proof:
│     ├─ ID Type (Aadhaar, Passport, DL, Voter ID)
│     ├─ ID Number (validated per type)
│     └─ Upload ID Proof (file validated)
├─ Guest list displayed in expandable tree format:
│  └─ Click to expand/collapse each guest
│     ├─ Personal Information section
│     ├─ Travel Details section (if provided)
│     └─ Government ID section (if provided)
├─ Accommodation needed? (Checkbox)
    ↓
Step 4: Final Confirmation
├─ Confirm information accuracy
├─ Consent to data usage
├─ Submit RSVP
    ↓
Success Page with full submitted data summary
    ↓
Redirect to Dashboard
```

### Guest List View Flow (Enhanced)
```
EventDetail Page
    ↓
Click "Guest List" card or navigate to /guests/:id
    ↓
GuestList page loads with full CRUD functionality:
    ↓
Display enhanced table with columns:
├─ Checkbox (for bulk select)
├─ Name (with expand toggle for additional guests)
├─ Email, Phone, City
├─ RSVP Status (Yes/Maybe/Cannot attend)
├─ Sangeet, Shaadi (function attendance)
├─ Accommodation, Source (RSVP/Uploaded/Manual)
├─ WhatsApp Status (Pending/Success/Failed/Not Sent)
├─ Documents (link to DocumentsModal)
├─ Actions (Edit, Delete, Message, RSVP Link)
    ↓
Each column header has ColumnFilterHeader:
├─ Search within values
├─ Multi-select filter
├─ Sort ascending/descending
├─ Visual active filter indicators
    ↓
Actions available:
├─ Add Guest (inline form modal)
├─ Edit Guest (modal with pre-filled data)
├─ Import from CSV/Excel (bulk upload)
├─ Delete single or bulk (with confirmation)
├─ Send Message to individual guest
├─ Copy RSVP Link for guest
├─ View/Upload Documents per guest
├─ Export to Excel
    ↓
Back to Events
```

### Bulk Messaging Flow
```
EventDetail Page → Click "Messaging" card
    ↓
BulkMessaging page loads
    ↓
Three tabs available:
├─ Compose Message (default)
├─ Upload & Auto-Send
└─ Message History

Compose Message Tab:
├─ Enter Message Title
├─ Enter Message Content
├─ Select Target Events/Functions:
│  ├─ Welcome Lunch
│  ├─ Mehendi
│  ├─ Sangeet
│  ├─ Haldi
│  ├─ Wedding Ceremony
│  ├─ Reception
│  └─ Farewell Brunch
├─ Preview panel shows:
│  ├─ Message preview
│  ├─ Selected functions
│  └─ Number of recipients (guests attending selected functions)
├─ Actions:
│  ├─ "Save as Draft" → Save message for later sending
│  └─ "Send Now" → Save and send immediately
    ↓
Upload & Auto-Send Tab:
├─ Download CSV Template
├─ Upload Excel/CSV file with guest data
├─ System auto-detects attending events from file columns
├─ Displays detected guests with their attending events
├─ Auto-detect logic:
│  ├─ Looks for standard event columns (Yes/No format)
│  ├─ Supports event name variations (Mehndi, Mehendi, Haldi, etc.)
│  ├─ Can detect from free-text "Events" or "Notes" columns
│  ├─ Matches guests by name first, then by email
└─ Actions:
   ├─ "Clear & Start Over" → Reset and upload different file
   └─ "Auto-Send Messages Now" → Create and send personalized messages

Auto-Send Process:
├─ For each detected guest:
│  ├─ Match to existing guest by name or email
│  ├─ If matched AND has attending events:
│  │  ├─ Create message with detected events in title
│  │  ├─ Auto-populate message content
│  │  ├─ Mark as auto-sent
│  │  └─ Record recipient guest ID
│  └─ Move to next guest
├─ Show progress bar with completion percentage
├─ Display summary: "Sent X messages to Y guests"
└─ Save upload history for reference

Message History Tab:
├─ Sent Messages Section
└─ Drafts Section (with send/delete options)
```

---

## Key Features

### 1. User Management
- Sign up with email/password
- Login with credentials
- Session persistence via localStorage
- Logout functionality

### 2. Wedding Event Management
- Create multiple wedding events
- Store event details (couple names, date, venue, story)
- Upload cover images (base64)
- Search events by keywords
- Delete events
- View event statistics (total RSVPs, guests, attendees)

### 3. RSVP Collection with Advanced Validation
- Multi-step form with comprehensive validation
- **Country-specific mobile validation:**
  - 14 countries supported with exact digit count validation
  - Country code dropdown with flags
  - Real-time input filtering (digits only)
  - Automatic truncation when country changes
  - Visual feedback (green/red borders)
- **Email validation:**
  - Proper format validation (name@domain.com)
  - Domain and local part validation
  - No consecutive dots, start/end dots
  - Real-time validation on blur
- **Government ID validation with type-specific formats:**
  - Aadhaar Card: 12 digits, cannot start with 0 or 1
  - Passport: 1 letter + 7 digits (e.g., A1234567)
  - Driving License: 2 letters + 13 digits (e.g., MH0120110012345)
  - Voter ID: 3 letters + 7 digits (e.g., ABC1234567)
  - Real-time character filtering per type
  - Paste protection to prevent invalid input
- **Travel information with PNR validation:**
  - Flight PNR: 6 alphanumeric characters (e.g., ABC123)
  - Train PNR: 10 numeric digits (e.g., 1234567890)
  - Real-time uppercase conversion for flight PNRs
  - Visual validation feedback
- **File upload restrictions and UX:**
  - Allowed: Images (JPG, PNG, WEBP, GIF) + PDF only
  - Blocked: ZIP, DOCX, XLSX, TXT, EXE, etc.
  - Max 5MB file size with error messages
  - Upload success state with file preview:
    - File name display (truncated if long)
    - File size in KB
    - Success indicator with checkmark
    - Remove button to replace file
  - Applied to ID proofs and travel tickets
- Attendance tracking (single/couple/family)
- Function-wise RSVP (Mehendi, Wedding, Reception, etc.)
- Additional guest management with full validation
- Accommodation preferences
- Dietary restrictions & special assistance
- Data consent management

### 4. Bulk Messaging
- Send event-specific messages to guests
- Filter recipients by event functions (Mehendi, Sangeet, Haldi, etc.)
- Automatic recipient calculation based on guest attendance
- Compose messages with title and content
- Save messages as drafts before sending
- Track sent messages and delivery history
- Preview how many guests will receive each message
- Only guests attending selected functions receive relevant messages

### 5. Auto-Detect Guest Lists & Auto-Send Messages
- Upload Excel or CSV files with guest data
- Auto-detect which events each guest is attending
- Intelligent event name matching (supports variations like "Mehndi", "Haldi", "Wedding Ceremony", etc.)
- Automatically match guests by name or email
- Create event-specific messages per guest automatically
- Send personalized messages based on detected attendance
- Each guest receives messages only for events they're attending
- Track upload history with processing statistics
- Download CSV template for proper file format

### 6. Guest Management (Full CRUD)
- View all RSVPs for an event in dedicated GuestList page
- **Add guests manually** via inline form modal (first name, last name, phone, email, city, function attendance, accommodation, WhatsApp status)
- **Edit existing guests** via modal with pre-filled data
- **Single guest deletion** with delete button in each row
- **Bulk deletion** with checkboxes for multiple guests
- **Delete additional guests** individually from expanded guest sections
- **Confirmation modal** before deleting single or multiple guests
- **Toast notifications** for successful/failed deletions (auto-dismiss after 4 seconds)
- **Loading states** during deletion with spinner and disabled buttons
- **Auto-clear selection** when filters or search changes
- **Source tracking** badges: RSVP Form (blue), Uploaded (orange), Manual (green)
- **WhatsApp status tracking** column with color-coded badges
- **RSVP link sharing** via copy-to-clipboard per guest
- **Individual messaging** to guests from the list
- **Expandable rows** showing additional guest details in tree format
- Import guests from CSV/Excel files (bulk upload)
- Export guest data to Excel (.xlsx)
- Filter by various criteria
- Track guest count statistics

### 7. Column Filtering & Sorting
- **Per-column filter dropdowns** on every table column header
- **Search within filter** to find specific values
- **Multi-select filtering** with checkboxes for each unique value
- **Select All / Deselect All** toggle
- **Ascending/descending sorting** per column
- **Visual indicators** for active filters (rose badge dot)
- **Clear filter** action per column
- **Click-outside dismissal** for dropdown menus

### 8. Document Management System
- **RSVP Form integration** - guests can upload documents at Step 4 (Final Confirmation)
- **Guest List integration** - Documents column with upload link per guest
- **DocumentsModal** - full-featured document management modal:
  - Grid view with thumbnail cards
  - List view with detailed file info
  - Upload multiple files (images + PDF, max 10MB)
  - File type validation (JPG, PNG, WEBP, GIF, BMP, PDF)
  - Image preview with modal
  - Select individual or all documents
  - Download selected or all documents
  - Delete selected documents with confirmation
  - File size display and file type icons
- **documentService.ts** utility functions:
  - `fileToBase64()` - convert files to base64
  - `base64ToBlob()` - convert base64 back to blob
  - `validateDocumentFile()` - validate type and size
  - `createGuestDocument()` - create document metadata
  - `downloadDocument()` - trigger browser download
  - `downloadDocumentsAsZip()` - batch download with naming
  - `getFileIcon()` / `formatFileSize()` / `getPreviewUrl()`

### 9. WhatsApp Integration (Mock)
- **WhatsApp messaging service** with mock implementation for development
- **Bulk message sending** to uploaded guests
- **Status tracking** per guest (Pending/Success/Failed/Not Sent)
- **Message templates** with guest name, event details, and attending functions
- **International phone formatting** using country codes
- **Retry mechanism** for failed messages
- Ready for production integration with Twilio WhatsApp API

### 10. Data Export
- Export guest list to Excel format
- Includes all guest information
- Formatted spreadsheet with proper headers

---

## UI/UX Patterns

### Color Scheme
- **Primary:** Rose/Pink (`from-rose-600 to-pink-600`)
- **Success:** Emerald Green
- **Warning:** Amber Yellow
- **Error:** Red
- **Info:** Blue

### Component Styling
- **Cards:** Rounded borders with subtle shadows
- **Buttons:** Gradient backgrounds, hover effects
- **Forms:** Full-width inputs with padding
- **Status Badges:** Color-coded with background
- **Tables:** Bordered rows with hover effects

### Responsive Design
- Mobile-first approach
- Grid layouts with `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Full-width table views with horizontal scroll
- Flexible image dimensions

---

## State Management

### Global State (AuthContext)
```
AuthContext
├─ isAuthenticated: boolean
├─ user: User | null
├─ login(email, password): void
├─ signup(name, email, mobile, password): void
└─ logout(): void
```

### Local Component State
- Page-level state (step numbers, view toggles)
- Form data state (RSVPForm with detailed object)
- Modal/Dialog visibility states
- Table sort/filter states

---

## Database Operations

### User Operations
- `addUser(user)` - Register new user
- `getUser(email)` - Authenticate user
- `getAllUsers()` - Get all registered users

### Event Operations
- `addEvent(event)` - Create new event
- `getEvent(id)` - Fetch single event
- `getEvents()` - Fetch all events
- `deleteEvent(id)` - Remove event
- `searchEvents(query)` - Search by couple names

### Guest Operations
- `addGuest(guest)` - Submit RSVP
- `updateGuest(id, updates)` - Update guest details
- `deleteGuest(id)` - Delete single guest
- `deleteGuests(ids)` - Bulk delete multiple guests
- `getGuestsByEvent(eventId)` - Get event's RSVPs
- `getGuests()` - Get all guests across events
- `addGuestsBulk(guestList)` - Bulk add guests from CSV/Excel
- `addGuestsBulkWithWhatsApp(guestList, eventId, sendWhatsApp)` - Bulk add with WhatsApp messaging
- `updateGuestWhatsAppStatus(guestId, status, sentAt)` - Update WhatsApp delivery status
- `convertParsedGuestToGuest(parsedGuests, eventId)` - Convert parsed CSV data to Guest objects

### Bulk Message Operations
- `createMessage(message)` - Create new draft or send message
- `getMessages()` - Get all messages across events
- `getMessagesByEvent(eventId)` - Get messages for specific event
- `updateMessage(id, updates)` - Update message details
- `sendMessage(messageId)` - Mark message as sent
- `deleteMessage(id)` - Remove message
- `getRecipientsForMessage(eventId, selectedFunctions)` - Calculate guests receiving message based on function attendance

### Uploaded Guest List Operations
- `createUploadedGuestList(list)` - Save uploaded guest list metadata
- `getUploadedGuestLists()` - Get all uploaded lists
- `getUploadedGuestListsByEvent(eventId)` - Get lists for specific event
- `deleteUploadedGuestList(id)` - Remove upload record
- `findGuestByNameOrEmail(eventId, name, email)` - Match guest in system by name or email
  - First tries exact name match (case-insensitive)
  - Then tries email match if provided
  - Finally tries partial name match
  - Returns matching guest or undefined

### Document Management Operations (documentService.ts)
- `createGuestDocument(file, guestId, uploadedBy, relatedGuestId?, description?)` - Convert File to GuestDocument
- `fileToBase64(file)` - Convert File object to base64 string
- `base64ToBlob(base64, contentType)` - Convert base64 to Blob for download
- `validateDocumentFile(file)` - Validate file type and size
- `downloadDocument(document)` - Download single document as file
- `downloadMultipleDocuments(documents)` - Download multiple documents
- `downloadDocumentsAsZip(documents, guestName)` - Download multiple with naming pattern
- `getFileIcon(fileType)` - Get emoji icon for file type (🖼️ for images, 📄 for PDF)
- `formatFileSize(bytes)` - Format file size for display
- `getPreviewUrl(document)` - Get preview URL for image documents
- `uploadGuestDocument(file, eventId, guestId, fileName)` - Upload to Supabase storage

### Guest List File Parsing
- `parseGuestListFile(file)` - Parse Excel/CSV file and extract guest data with flexible column matching
- `normalizeEventName(name)` - Convert event aliases to standard names
- `generateSampleGuestListCSV()` - Generate downloadable CSV template

#### Flexible Column Detection
The parser intelligently detects common column variations:

**Guest Name Columns:**
- Exact matches: "Name", "Guest Name", "Full Name", "Guest"
- Case-insensitive and partial matches: Any column containing "name" or "guest"

**Email Columns:**
- Exact matches: "Email", "E-mail", "Email Address"
- Case-insensitive partial matches: Any column containing "email"

**Mobile/Contact Columns:**
- Exact matches: "Mobile", "Phone", "Contact", "Mobile Number", "Contact No", "Contact Number", "Phone Number"
- Case-insensitive partial matches: Any column containing "contact", "mobile", or "phone"

**Event Attendance Columns:**
- Supports dedicated event columns with Yes/No values (recommended)
- Recognizes event variations: "Wedding" → "Wedding Ceremony", "Mehendi" → "Mehendi", etc.
- Case-insensitive column name matching
- Falls back to free-text detection in "Events", "Notes", "Functions", "Attending" columns

#### Event Name Recognition
The system recognizes event variations:
- **Mehendi variations**: "mehendi", "mehndi", "henna"
- **Sangeet variations**: "sangeet", "songs", "music"
- **Haldi variations**: "haldi", "turmeric"
- **Wedding variations**: "wedding", "ceremony", "main event" → "Wedding Ceremony"
- **Reception variations**: "reception", "dinner", "party"
- **Farewell variations**: "farewell", "brunch", "goodbye" → "Farewell Brunch"
- **Welcome variations**: "welcome", "lunch", "arrival" → "Welcome Lunch"

Supported file formats for detection:
- Event columns with Yes/No values (recommended format)
- Free-text "Events" or "Notes" columns with event keywords
- Case-insensitive matching
- Handles missing or empty columns gracefully

### Session Operations
- `setSession(user)` - Store user session in sessionStorage
- `getSession()` - Get current user session
- `clearSession()` - Clear user session on logout

### Data Storage
- **Key Format:** `wedding_users`, `wedding_events`, `wedding_guests`, `wedding_messages`, `wedding_uploaded_guest_lists`
- **Format:** JSON stringification in localStorage
- **Session:** sessionStorage for user authentication session
- **Documents:** base64-encoded file data stored within guest records
- **Persistence:** Browser localStorage (max ~5-10MB)

---

## Route Structure

| Path | Component | Auth Required | Purpose |
|------|-----------|---------------|---------|
| `/` | AuthPage | No | Login/Signup |
| `/dashboard` | Dashboard | Yes | Event list & management |
| `/create-event` | CreateEvent | Yes | Create new wedding event |
| `/event/:id` | EventDetail | Yes | Event details, feature cards, guest list |
| `/guests/:id` | GuestList | Yes | Full guest list table view |
| `/rsvp/:id` | RSVPForm | Yes | Submit RSVP response with document upload |
| `/messaging/:id` | BulkMessaging | Yes | Compose and send bulk messages to guests |
| `*` | Navigate to `/` | - | Catch-all redirect |

---

## Error Handling

### Form Validation
- Required field validation per step
- **Mobile number validation:**
  - Country-specific digit count validation
  - Real-time error messages
  - Visual feedback with red borders
- **Email format validation:**
  - Comprehensive email pattern checking
  - Domain and structure validation
  - Error messages on blur
- **Government ID validation:**
  - Type-specific format validation
  - Real-time validation during typing
  - Descriptive error messages per ID type
- **PNR validation:**
  - Flight: 6 alphanumeric characters
  - Train: 10 numeric digits
  - Visual feedback with error messages
- **File upload validation:**
  - File type checking (Images + PDF only)
  - File size validation (max 5MB)
  - Specific error messages showing:
    - Invalid file type with actual type
    - File size in MB if exceeds limit
- Conditional validation based on selections

### Error Display
- Red banner messages for form errors
- Inline error messages below invalid fields
- Toast-like notifications in forms
- Validation feedback on submission
- Color-coded borders (red for errors, green for valid)

### User Feedback
- Success confirmation screen after RSVP
- Detailed summary of submitted data
- Loading states during operations
- Upload success indicators with file details
- Visual validation states throughout forms

---

## Future Enhancement Points

1. **Backend Integration**
   - Replace localStorage with Supabase/Firebase
   - Real-time sync across devices
   - Cloud storage for images

2. **Additional Features**
   - Payment/gift registry integration
   - Photo sharing gallery
   - Live messaging between guests
   - Itinerary management
   - Seating arrangements
   - Vendor management

3. **Analytics**
   - RSVP statistics dashboard
   - Response rate tracking
   - Guest demographics visualization

4. **Notifications**
   - Email reminders
   - SMS notifications
   - Push notifications

---

## Performance Considerations

1. **Image Optimization**
   - Store images as base64 or URLs
   - Compress before upload
   - Consider CDN for deployment

2. **State Management**
   - Minimize context provider levels
   - Use useCallback for optimized functions
   - Memoize components if needed

3. **Data Loading**
   - Load events on dashboard mount
   - Fetch guests only when needed
   - Implement pagination for large guest lists

---

## Security Considerations

### Current Implementation
- Basic email/password validation
- localStorage for session storage
- No server-side validation
- **Client-side input validation:**
  - Country-specific mobile number validation
  - Email format validation
  - Government ID format validation
  - File type and size validation
  - Real-time character filtering
  - Paste protection for validated fields

### Recommendations
- Add HTTPS enforcement
- Implement JWT tokens
- Server-side authentication
- Data encryption for sensitive info
- GDPR compliance for guest data
- **File upload security:**
  - ✅ Client-side file type validation (currently implemented)
  - Server-side file validation (recommended for production)
  - Virus scanning for uploaded files
  - Secure file storage with access controls
  - File name sanitization
- Input sanitization before database storage
- Rate limiting for form submissions
- CSRF protection

---

## Testing Strategy

### Unit Tests
- Database CRUD operations
- Form validation functions
- Helper utilities

### Integration Tests
- Authentication flow
- Event creation flow
- RSVP submission flow

### E2E Tests
- Complete user journeys
- Feature card interactions
- Multi-step form completion

---

## WhatsApp Integration

### Overview
The system integrates with **WhatsApp Business Cloud API** to send bulk messages directly to guests without manual intervention. The implementation uses a secure proxy architecture with Supabase Edge Functions to protect API credentials.

### Architecture
```
┌─────────────┐       ┌──────────────────────────┐       ┌─────────────────────┐
│  React App  │──POST──▶  Supabase Edge Function  │──POST──▶  Meta Graph API    │
│  (Browser)  │       │  /send-whatsapp          │       │  WhatsApp Cloud API │
│             │◀─JSON──│  (holds access token)    │◀─JSON──│  v21.0/messages    │
└─────────────┘       └──────────────────────────┘       └─────────────────────┘
```

**Security Benefits:**
- API tokens **never** reach browser
- Supabase Edge Function acts as secure proxy
- Tokens stored as Supabase secrets only
- All sensitive operations happen server-side

### Supported Message Types
1. **Automatic Messages** - Via WhatsApp Business API without manual send
2. **Fallback to wa.me** - If API not configured, falls back to WhatsApp Web links
3. **Template Messages** - Pre-approved by Meta (required for first contact)
4. **Free-form Text** - For conversations in 24-hour reply window

### Configuration Requirements

**Prerequisites:**
- Meta Business account: [business.facebook.com](https://business.facebook.com/)
- Meta Developer account: [developers.facebook.com](https://developers.facebook.com/)
- Supabase project with Edge Functions enabled
- WhatsApp Business Account with verified phone number

**Credentials Needed:**
- **Phone Number ID**: ID of WhatsApp phone number in Meta dashboard
- **Business Account ID**: Meta Business Account ID
- **Access Token**: Long-lived access token from Meta App Settings
- **Webhook Verify Token**: Custom token for webhook security (optional)

**Supabase Setup:**
- Deploy `supabase/functions/send-whatsapp/index.ts` as Edge Function
- Set secrets in Supabase:
  - `WHATSAPP_PHONE_NUMBER_ID`
  - `WHATSAPP_ACCESS_TOKEN`
  - `WHATSAPP_BUSINESS_ACCOUNT_ID`

### WhatsApp Service Functions

#### `whatsappService.ts`
Main service for WhatsApp integration:

```typescript
// Send message via API or fallback to wa.me link
sendWhatsAppMessage(
  phoneNumber: string,
  message: string,
  countryCode?: string,
  fallbackUrl?: string
): Promise<SendResult>

// Get formatted phone number with country code
formatPhoneNumber(mobile: string, countryCode: string): string

// Check if WhatsApp is configured
isWhatsAppConfigured(): boolean
```

#### `whatsappUtils.ts`
Utility functions for WhatsApp integration:

```typescript
// Generate wa.me link (WhatsApp Web fallback)
generateWaLink(phoneNumber: string): string

// Format phone number for wa.me link
formatPhoneNumberForWaLink(mobile: string, countryCode: string): string

// Validate phone number format
isValidPhoneNumber(mobile: string): boolean
```

#### Supabase Edge Function: `send-whatsapp/index.ts`
Secure proxy for WhatsApp API calls:

```typescript
// Request payload structure
{
  phoneNumber: string;        // Full phone number with country code
  message: string;            // Message content
  countryCode?: string;       // Optional: country code for formatting
}

// Response structure
{
  success: boolean;
  messageId?: string;         // Message ID from WhatsApp API
  status?: string;            // Message status (sent, failed, etc.)
  error?: string;             // Error message if failed
  fallbackUrl?: string;       // wa.me link as fallback
}
```

### Message Status Tracking

Messages are tracked with the following states:
- **Success**: Message sent via WhatsApp API successfully
- **Pending**: Message queued for sending
- **Failed**: API request failed, fallback to wa.me link
- **Not Sent**: Message in draft or not sent yet

### Guest Targeting Capabilities

Guests can be targeted based on:
- **Specific Functions**: Select which wedding events/functions to target
  - Welcome Lunch
  - Mehendi
  - Sangeet
  - Haldi
  - Wedding Ceremony
  - Reception
  - Farewell Brunch
- **Attendance Status**: Yes, Maybe, Cannot Attend
- **Custom Filters**: By city, meal preference, special assistance needs, etc.

### Message Composition Features

**Compose Tab Features:**
- Title field for message organization
- Rich message content with formatting support
- Function/event selection with checkboxes
- Real-time recipient count calculation
- Message preview panel
- Save as draft option
- Send immediately option

**Auto-Send Features:**
- Upload guest list (Excel/CSV format)
- Auto-detect which events each guest is attending
- Intelligent event name matching
- Automatic guest matching by name/email
- Personalized message generation
- Batch sending with progress tracking
- Upload history with statistics

### Error Handling & Fallback

If WhatsApp API call fails:
1. Logs error to console
2. Returns wa.me link as fallback
3. User can manually send via WhatsApp Web
4. Message status shows "Failed" but user gets alternative option
5. Graceful UI feedback with error message

### Limits & Considerations

**API Rate Limits:**
- Meta imposes limits on message throughput
- Implement throttling for bulk sends
- Recommended: 80 messages/second for verified numbers
- Upgrade account for higher limits

**Message Quality:**
- First message to customer must be template
- Template must be pre-approved by Meta
- Free-form text only allowed within 24-hour window
- Messages to similar numbers may be blocked (spam detection)

**Cost Considerations:**
- WhatsApp Business API is a paid service
- Charges based on message volume and type
- Template messages: free tier available
- Utility messages: charged per message

---

## Document Management System

### Overview
Complete document lifecycle management for guest RSVP submissions. Documents are uploaded with RSVP forms and immediately synchronized to guest list views for easy retrieval and download.

### Supported Document Types

**ID Documents:**
- Aadhaar Card (front & back)
- Passport (front & back)
- Driving License (front & back)
- Voter ID (front & back)

**Travel Documents:**
- Flight Tickets
- Train Tickets
- Travel Insurance
- Visa Documents

**General Documents:**
- Emergency Contact Proof
- Health Declarations
- Special Accommodation Requests
- Other supporting documents

### File Specifications

**Allowed File Types:**
- Images: JPG, PNG, WEBP, GIF, BMP
- Documents: PDF
- Total: 6 supported formats

**Size Limits:**
- Individual file: Maximum 10MB
- Multiple files per guest: No limit on count
- Storage: Base64-encoded in localStorage/Supabase

**File Validation:**
- ✅ Client-side type & size validation
- ✅ MIME type verification
- ✅ Extension checking
- ⚠️ Server-side validation recommended for production

### Document Management Operations (documentService.ts)

**Core Functions:**

```typescript
// Convert file to GuestDocument object
createGuestDocument(
  file: File,
  guestId: string,
  uploadedBy: 'guest' | 'admin',
  relatedGuestId?: string,
  description?: string
): Promise<GuestDocument>

// Validate file before upload
validateDocumentFile(file: File): {
  valid: boolean;
  error?: string;
}

// Download single document
downloadDocument(document: GuestDocument): void

// Download multiple documents
downloadMultipleDocuments(documents: GuestDocument[]): void

// Download as ZIP file
downloadDocumentsAsZip(documents: GuestDocument[], guestName: string): void

// Get preview URL for documents
getPreviewUrl(document: GuestDocument): string

// Get file type icon
getFileIcon(fileType: string): string

// Format file size for display
formatFileSize(bytes: number): string

// Upload to cloud storage
uploadGuestDocument(
  file: File,
  eventId: string,
  guestId: string,
  fileName: string
): Promise<UploadResult>
```

### Document Display & Management

**In Guest List Table:**
- Documents Column shows:
  - Count of documents uploaded
  - Link to open Documents Modal
  - "—" if no documents uploaded

**DocumentsModal Component:**
- Full-screen document viewer
- Grid view (default) and list view
- Document thumbnails with file icons
- File size and upload date display
- Download individual or multiple documents
- Delete document functionality
- Upload additional documents
- Search/filter documents by name

**Features:**
- 🖼️ Image preview for uploaded documents
- 📄 PDF preview support
- ✅ File type indicators with emojis
- 📥 Bulk download with ZIP
- 🗑️ Individual and bulk delete
- 📤 Additional uploads without re-doing RSVP
- 📊 Document statistics (count, total size)

### Document Lifecycle

1. **Upload During RSVP:**
   - Documents uploaded as part of Step 4 final confirmation
   - Converted to base64 and stored in GuestDocument array
   - Automatically saved with guest RSVP

2. **Immediate Sync:**
   - Documents appear in guest list immediately after RSVP submission
   - No refresh required
   - Guest List shows "Documents (X)" link

3. **Access & Download:**
   - Click "Documents (X)" link in guest list
   - DocumentsModal opens with all guest documents
   - View, download, or delete documents
   - Download options:
     - Individual document download
     - Multiple selected documents download
     - All documents as ZIP file

4. **Deletion:**
   - Individual document deletion with confirmation
   - Bulk deletion with checkboxes
   - Deleted documents removed from guest record

### Storage Architecture

**Client-side (localStorage):**
- Documents stored as base64 in GuestDocument objects
- Persisted with guest RSVP record
- Automatic sync to all tabs
- Max ~5-10MB due to localStorage limits

**Cloud Storage (Supabase - Optional):**
- Alternative for large file volumes
- Separate bucket for guest documents
- Metadata stored in database
- Files streamed from CDN

### File Size Calculation

Total storage per document:
```
File Size = (Actual File Bytes × 1.33) + Metadata Overhead
```
Example:
- 2MB image → ~2.66MB in localStorage
- 10 documents × 1MB average → ~13.3MB total

### Security & Privacy

**Current Implementation:**
- ✅ Client-side file type validation
- ✅ File size limits enforced
- ✅ Base64 encoding for safe storage
- ⚠️ Stored in localStorage (browser accessible)

**Recommendations for Production:**
- Server-side file validation
- Virus/malware scanning (ClamAV or similar)
- Encrypt documents at rest
- HTTPS only transmission
- Access controls (guest can only upload their own documents)
- Audit logging for downloads
- GDPR compliance data retention

### Performance Considerations

**Optimization Strategies:**
- Lazy load document previews
- Pagination for large document collections
- Compression before storage
- CDN delivery for cloud-stored files
- Cache-busting for document updates

**Large File Handling:**
- Warn users for files >5MB
- Show upload progress indicator
- Stream large downloads
- Implement resumable uploads for cloud storage

---

## Environment Variables & Configuration

### `.env` File Structure
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# WhatsApp Configuration (Optional)
VITE_WHATSAPP_PHONE_NUMBER_ID=101234567890123
VITE_WHATSAPP_API_ENABLED=true
VITE_WHATSAPP_FALLBACK_ENABLED=true

# Feature Flags
VITE_ENABLE_DOCUMENT_MANAGEMENT=true
VITE_ENABLE_BULK_MESSAGING=true
VITE_ENABLE_WHATSAPP_INTEGRATION=true
```

### Supabase Secrets (for Edge Functions)
```
WHATSAPP_PHONE_NUMBER_ID=101234567890123
WHATSAPP_ACCESS_TOKEN=EABxxxxxxxxxx...
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789...
WHATSAPP_WEBHOOK_VERIFY_TOKEN=custom-token-123
```

---

## Recent Changes & Updates

### Latest Features (May 2026)
- ✅ WhatsApp Business API integration with secure proxy
- ✅ Document management system with base64 storage
- ✅ Auto-detect guest lists with event attendance parsing
- ✅ Bulk messaging with function-based targeting
- ✅ DocumentsModal for document viewing/management
- ✅ Country-specific phone validation (14 countries)
- ✅ Government ID format validation
- ✅ Flight/Train PNR validation
- ✅ File upload with type/size validation
- ✅ Supabase Edge Functions for secure API proxy
- ✅ Guest list auto-send messaging
- ✅ Upload history tracking

### Known Issues & TODOs
- [ ] Implement rate limiting for bulk sends
- [ ] Add virus scanning for uploaded documents
- [ ] Server-side file validation
- [ ] Document encryption at rest
- [ ] Email integration for RSVP confirmations
- [ ] SMS notifications for guests
- [ ] Real-time RSVP updates
- [ ] Advanced analytics dashboard
- [ ] Payment/gift registry integration

---

## Version History

- **v1.0.0** (May 2026) - Initial release with core RSVP, guest management, bulk messaging, and WhatsApp integration
- **Features:** Event management, multi-step RSVP form, guest list tracking, document uploads, bulk messaging, WhatsApp API integration

---

## Auto-Detection & Auto-Send Feature

### How Auto-Detection Works

The system automatically detects which events guests are attending from uploaded Excel/CSV files:

#### File Parsing Process
1. **Upload File** - Admin uploads Excel or CSV file with guest data
2. **Extract Guest Info** - Parser intelligently extracts:
   - Guest name (from any column containing "name" or "guest", case-insensitive)
   - Email (from any column containing "email", case-insensitive)
   - Mobile (from columns like "Mobile", "Contact No", "Phone", or any containing "contact"/"mobile"/"phone")
   - Event attendance (from dedicated columns OR free-text "Events"/"Notes" columns)

3. **Event Detection** - System uses a 3-step approach:
   - **Step 1 - Exact Column Match**: Looks for dedicated event columns (e.g., "Mehendi", "Wedding", "Sangeet") with Yes/No values
   - **Step 2 - Flexible Column Names**: If Step 1 finds no events, scans all columns with Yes/No values and maps event keywords (e.g., "wedding" → "Wedding Ceremony")
   - **Step 3 - Free-Text Detection**: If still no events found, searches "Events", "Notes", "Functions", "Attending" columns for event keywords

#### Event Name Variations Supported
- Mehendi: "mehendi", "mehndi", "henna"
- Sangeet: "sangeet", "songs", "music"
- Haldi: "haldi", "turmeric"
- Wedding: "wedding", "ceremony", "main event"
- Reception: "reception", "dinner", "party"
- Farewell: "farewell", "brunch", "goodbye"
- Welcome: "welcome", "lunch", "arrival"

#### Guest Matching
After parsing, the system matches detected guests to your RSVP database:
1. **Exact Name Match** - Case-insensitive exact name comparison
2. **Email Match** - If exact name fails, tries email matching
3. **Partial Match** - If both fail, tries partial name matching
4. Only matched guests receive auto-sent messages

#### Message Creation & Sending
For each matched guest with detected events:
1. Creates a personalized message title including their events
2. Auto-populates message content addressing the guest
3. Marks message as auto-sent (traceable)
4. Records guest ID as recipient
5. Sends immediately to that specific guest

#### Upload History
- All uploads are tracked with metadata
- Shows: guest count, messages sent, upload date
- Can be deleted from history
- Helps audit messaging activity

### CSV Template Format

The recommended formats include:

**Format 1: Dedicated Event Columns with Yes/No**
```
Name, Email, Contact No, Mehendi, Sangeet, Haldi, Wedding, Reception, Farewell Brunch
Kaushal Mistry, kaushal@example.com, 9876543210, No, No, Yes, Yes, Yes, Yes
Ankita Mistry, ankita@example.com, 9876543211, No, No, No, Yes, No, No
Priya Singh, priya@example.com, 9876543212, Yes, Yes, Yes, Yes, Yes, No
```

**Format 2: Free-Text Event Column**
```
Name, Email, Contact Number, Events
Kaushal Mistry, kaushal@example.com, 9876543210, Haldi, Wedding, Reception
Ankita Mistry, ankita@example.com, 9876543211, Wedding Ceremony
Priya Singh, priya@example.com, 9876543212, Mehendi, Sangeet, Haldi, Wedding, Reception
```

**Format 3: Flexible Column Names**
```
Guest Name, Contact No, Mobile, Mehendi, Wedding, Reception, Notes
Kaushal Mistry, 9876543210, , No, Yes, Yes, Attending with family
Ankita Mistry, , 9876543211, No, Yes, No, Cannot attend Mehendi
```

**Key Points:**
- Column names are flexible and case-insensitive
- "Contact No", "Mobile", "Phone" are all recognized for contact information
- Event columns can use short names ("Wedding", "Mehendi") or full names ("Wedding Ceremony", "Mehendi")
- Yes/No values (case-insensitive) indicate attendance: "Yes", "Y", "1", "true"
- Missing columns are handled gracefully
- The parser continues even if some guests lack email or mobile data
- At least the guest name must be present for a guest to be imported

---

## Deployment

### Build
```bash
npm run build
```

### Production
- Host on Vercel, Netlify, or similar
- Configure environment variables
- Set up analytics
- Enable error tracking (Sentry)

---

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Key File Purposes

| File | Purpose |
|------|---------|
| `AuthContext.tsx` | Global authentication state |
| `db.ts` | localStorage CRUD operations (users, events, guests, messages, documents) |
| `constants.ts` | App-wide constants, country codes, and validation functions |
| `documentService.ts` | Document upload/download/validation/preview utilities |
| `guestListParser.ts` | Parse Excel/CSV files and detect event attendance |
| `guestUploadService.ts` | Bulk guest upload with WhatsApp integration |
| `whatsappService.ts` | WhatsApp messaging service (mock for dev, Twilio-ready) |
| `seedData.ts` | Dummy data seeding for development/testing |
| `ColumnFilterHeader.tsx` | Reusable column filter/sort dropdown component |
| `CountryCodeSelect.tsx` | Country code selector with flags (react-select) |
| `DocumentsModal.tsx` | Full document management modal (upload/preview/download/delete) |
| `App.tsx` | HashRouter route configuration & auth protection |
| `Dashboard.tsx` | Event list & management interface |
| `CreateEvent.tsx` | Event creation form |
| `EventDetail.tsx` | Event details, feature cards, guest list |
| `GuestList.tsx` | Full CRUD guest list with column filters, documents, WhatsApp status |
| `RSVPForm.tsx` | Multi-step RSVP collection form with document upload |
| `BulkMessaging.tsx` | Bulk messaging and auto-send features |
| `DocumentsModal.tsx` | Modal for viewing/managing guest documents |
| `WhatsAppMessageModal.tsx` | Modal interface to type and send WhatsApp messages |

---

### Constants & Configuration

### Supported Country Codes (14 Countries)
```javascript
COUNTRY_CODES = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳', digitCount: 10 },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸', digitCount: 10 },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧', digitCount: 10 },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦', digitCount: 10 },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺', digitCount: 9 },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪', digitCount: 9 },
  { code: 'SG', name: 'Singapore', dialCode: '+65', flag: '🇸🇬', digitCount: 8 },
  { code: 'MY', name: 'Malaysia', dialCode: '+60', flag: '🇲🇾', digitCount: 10 },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', flag: '🇳🇿', digitCount: 9 },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦', digitCount: 9 },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪', digitCount: 11 },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷', digitCount: 9 },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹', digitCount: 10 },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸', digitCount: 9 }
];
DEFAULT_COUNTRY_CODE = 'IN';  // India as default
```

### Functions Offered
```javascript
FUNCTIONS = [
  'Welcome Lunch',
  'Mehendi',
  'Sangeet',
  'Haldi',
  'Wedding Ceremony',
  'Reception',
  'Farewell Brunch'
];

ID_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID'
];

TRAVEL_MODES = [
  'By Flight',
  'By Train',
  'Myself'
];
```

### Validation Functions

#### Mobile Number Validation
```javascript
validateMobileNumber(mobile, countryCode)
// Returns: { isValid: boolean, error?: string }
// Validates exact digit count per country
// Example: India (IN) requires exactly 10 digits
// Automatically strips non-digit characters
```

#### Email Validation
```javascript
validateEmail(email)
// Returns: { isValid: boolean, error?: string }
// Validates proper email format (name@domain.com)
// Checks for:
// - Valid email pattern with @ and domain
// - No consecutive dots
// - No dots at start/end
// - Local part max 64 characters
// - Domain max 255 characters
// - Domain must include dot
```

#### Government ID Validation
```javascript
validateGovernmentId(idNumber, idType)
// Returns: { isValid: boolean, error?: string }
// Type-specific validation:

validateAadhaar(aadhaar)
// Format: Exactly 12 numeric digits
// Cannot start with 0 or 1
// Example: 234567890123

validatePassport(passport)
// Format: 1 uppercase letter + 7 digits
// Example: A1234567

validateDrivingLicense(dl)
// Format: 2 letters + 13 digits
// Example: MH0120110012345

validateVoterId(voterId)
// Format: 3 letters + 7 digits
// Example: ABC1234567
```

#### Flight PNR Validation
```javascript
validateFlightPNR(pnr)
// Returns: { isValid: boolean, error?: string }
// Format: Exactly 6 alphanumeric characters
// Automatically converts to uppercase
// Example: ABC123, XYZ789
```

#### Train PNR Validation
```javascript
validateTrainPNR(pnr)
// Returns: { isValid: boolean, error?: string }
// Format: Exactly 10 numeric digits
// Example: 1234567890
```

#### File Type Validation
```javascript
validateFileType(file)
// Returns: boolean
// Allowed types:
// - Images: JPEG, JPG, PNG, WEBP, GIF, BMP, SVG
// - Documents: PDF only
// Blocked: ZIP, DOCX, XLSX, TXT, EXE, etc.
// Max size: 5MB
// Shows error message if invalid type or size
```

---

## Form Validation Features

### Real-Time Input Filtering
All input fields implement real-time character filtering to prevent invalid input:

**Mobile Number Fields:**
- Automatically strips non-digit characters
- Enforces maximum length based on selected country
- Updates when country code changes (truncates if needed)
- Visual feedback: green border (valid), red border (invalid)

**Email Fields:**
- Trims whitespace automatically
- Validates on blur
- Shows error message for invalid format
- Visual feedback with border colors

**Government ID Fields:**
- Type-specific filtering:
  - **Aadhaar**: Only digits, max 12 characters
  - **Passport**: 1 letter (uppercase) + 7 digits, max 8 characters
  - **Driving License**: 2 letters (uppercase) + 13 digits, max 15 characters
  - **Voter ID**: 3 letters (uppercase) + 7 digits, max 10 characters
- Real-time validation during typing
- Prevents pasting invalid characters
- Visual feedback with green/red borders

**Flight PNR Fields:**
- Only alphanumeric characters allowed
- Automatically converts to uppercase
- Max 6 characters enforced
- Real-time validation with visual feedback

**Train PNR Fields:**
- Only numeric digits allowed
- Max 10 digits enforced
- Real-time validation with visual feedback

### File Upload Validation & UX

**Validation:**
- File type checking on selection
- Automatic rejection of invalid file types
- File size validation (max 5MB)
- Input field reset if invalid file selected
- Error messages showing:
  - Invalid file type with actual type selected
  - File size in MB if exceeds limit

**User Experience:**
- **Empty State**: 
  - Upload icon
  - "Click to upload" text
  - Allowed formats hint
- **Uploaded State**:
  - File icon with green background
  - File name (truncated if long)
  - File size in KB
  - Green checkmark with "Uploaded successfully" message
  - Remove button (X icon) to delete and replace
  - Hover effects on remove button

**Applied to:**
- Personal Details: ID Front/Back uploads
- Additional Guests: Government ID uploads
- Travel Details: Flight/Train ticket uploads (both personal and per guest)

### Visual Feedback System

**Border Colors:**
- **Blue** (default): Neutral state, field focused
- **Green**: Valid input confirmed
- **Red**: Invalid input with error message

**Validation States:**
- Shows validation immediately after user interaction
- Error messages appear below invalid fields
- Success indicators (checkmarks) for valid uploads
- Color-coded borders throughout form

**Paste Protection:**
- Special onPaste handlers filter invalid characters
- Works for all validated input fields
- Prevents bypassing real-time validation

---

## Constants & Configuration

---

## Communication & Integration Points

### For New Team Members
1. Start with `AuthPage` to understand authentication flow
2. Review `Dashboard` for event management patterns
3. Study `EventDetail` for feature card implementation
4. Deep dive into `RSVPForm` for complex form patterns
5. Understand `db.ts` for data operations

### For External Integration
- All data flows through `db.ts`
- Implement Supabase client in `db.ts` functions
- Update AuthContext for backend authentication
- Migration path: localStorage → backend database

---

## Version History

- **v1.0** - Initial release with core features
  - Event management
  - RSVP collection (5-step form)
  - Guest list view
  - Data export to Excel
  - Full-width responsive design

- **v1.1** - Enhanced validation and UX (May 2026)
  - **Country-specific mobile validation** (14 countries)
  - **Email format validation** with comprehensive checks
  - **Government ID validation** with type-specific formats:
    - Aadhaar Card (12 digits)
    - Passport (letter + 7 digits)
    - Driving License (2 letters + 13 digits)
    - Voter ID (3 letters + 7 digits)
  - **Flight PNR validation** (6 alphanumeric characters)
  - **Train PNR validation** (10 numeric digits)
  - **File upload restrictions**:
    - Only images (JPG, PNG, WEBP, GIF) + PDF allowed
    - 5MB max file size enforcement
    - Invalid file type/size error messages
  - **File upload UX enhancements**:
    - Upload success preview with file name and size
    - Success checkmark indicator
    - Remove/replace functionality
    - Visual feedback for all upload states
  - **Real-time input filtering**:
    - Character-level validation during typing
    - Paste protection to prevent invalid input
    - Auto-formatting (uppercase for PNRs, etc.)
  - **Visual validation feedback**:
    - Green borders for valid inputs
    - Red borders for invalid inputs
    - Inline error messages
    - Success indicators on uploads

- **v1.2** - Guest Management & Deletion (May 18, 2026)
  - **Single guest deletion** with delete button in each guest row
  - **Bulk delete functionality** with checkboxes for multiple guest selection
  - **Delete additional guests** individually from expanded guest sections
  - **Confirmation modal** before deleting single or multiple guests
  - **Toast notifications** for successful/failed deletions (auto-dismiss after 4 seconds)
  - **Loading states** during deletion with spinner and disabled buttons
  - **Error handling** with user-friendly error messages
  - **Auto-clear selection** when filters or search criteria changes
  - **Instant guest list updates** after successful deletion

- **v1.3** - Column Filtering & Sorting (May 2026)
  - **ColumnFilterHeader component** - reusable per-column filter/sort dropdown
  - **Multi-select filtering** with checkboxes for each unique column value
  - **Search within filter** values
  - **Ascending/descending sorting** per column
  - **Visual indicators** for active filters and sort state
  - **Select All / Clear filter** actions
  - Custom CSS animations for filter dropdown

- **v1.4** - Country Code Select Enhancement (May 2026)
  - **CountryCodeSelect component** using react-select with react-country-flag
  - **SVG flag icons** for all 14 supported countries
  - **Searchable dropdown** with custom rose-themed styling
  - Replaced inline country code dropdowns in RSVP form

- **v1.5** - Document Management System (May 2026)
  - **documentService.ts** - complete document handling utility:
    - File-to-base64 conversion for localStorage storage
    - File type validation (images + PDF, max 10MB)
    - Download individual or batch documents
    - Image preview URL generation
    - File size formatting and type icon mapping
  - **DocumentsModal component** - full-featured document manager:
    - Grid and list view toggle
    - Multi-file upload with progress
    - Select/deselect individual or all documents
    - Download selected or all documents
    - Delete with confirmation
    - Image preview modal
  - **RSVP Form (Step 4)** - optional document upload section
  - **GuestList** - Documents column with upload button per guest
  - **GuestDocument interface** added to data model

- **v1.6** - Enhanced GuestList with Full CRUD (May 2026)
  - **Add guest** via inline form modal (first/last name, phone, email, city, functions, accommodation, WhatsApp status)
  - **Edit guest** via pre-filled modal
  - **Bulk import** from CSV/Excel with parseGuestListFile
  - **Source tracking** badges: RSVP Form (blue), Uploaded (orange), Manual (green)
  - **WhatsApp status** column with color-coded badges
  - **RSVP link** copy-to-clipboard per guest
  - **Individual messaging** modal per guest
  - **Expandable rows** for additional guest details
  - **Import status** notifications with auto-dismiss
  - **WhatsApp Integration** (mock) with guestUploadService.ts and whatsappService.ts

---

**Last Updated:** May 24, 2026  
**Maintainers:** [Project Team]  
**Repository:** Yanikh-Wedding-RSVP
