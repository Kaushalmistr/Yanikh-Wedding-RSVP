# Wedding RSVP Management System - Project Context

## Project Overview

**Project Name:** Yanikh Wedding RSVP  
**Purpose:** A comprehensive wedding event management and RSVP tracking system that allows couples to create wedding events, collect RSVPs, manage guest information, and track attendance details.

**Live Demo:** https://withJoy.com/nanki-and-yuvraj-khanna/edit/cards/wedding/save-the-date

---

## Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** Tailwind CSS
- **State Management:** React Context API (AuthContext)
- **Icons:** Lucide React
- **Spreadsheet Export:** XLSX (SheetJS)
- **UUID Generation:** uuid

### Backend/Storage
- **Database:** localStorage (Client-side)
- **Authentication:** Custom localStorage-based auth
- **Data Persistence:** JSON serialization in localStorage

### Development
- **Package Manager:** npm
- **Node Version:** Latest compatible
- **Config:** tsconfig.json for TypeScript, vite.config.ts for build

---

## Project Structure

```
/Users/kaushalmistry/Downloads/Kaushal/Projects/Yanikh-Wedding-RSVP/
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state management
│   ├── lib/
│   │   ├── constants.ts         # App-wide constants
│   │   ├── db.ts                # Database layer (localStorage CRUD)
│   │   └── supabase.ts          # Placeholder for Supabase
│   ├── pages/
│   │   ├── AuthPage.tsx         # Login/Signup page
│   │   ├── Dashboard.tsx        # Events list & management
│   │   ├── CreateEvent.tsx      # Create new wedding event
│   │   ├── EventDetail.tsx      # Event details & guest list view
│   │   └── RSVPForm.tsx         # Multi-step RSVP form
│   ├── utils/
│   │   └── cn.ts                # Tailwind class utilities
├── public/
│   └── images/                  # Static assets
├── index.html                   # HTML entry point
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite config
├── package.json                 # Dependencies
└── README.md                     # Project documentation
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

### Guest RSVP Response
```typescript
interface Guest {
  id: string;
  eventId: string;
  
  // Personal Details
  name: string;
  mobile: string;
  email: string;
  city: string;
  gender: 'Male' | 'Female' | 'Other';
  respondingFor: 'Self' | 'Couple' | 'Family';
  
  // Attendance
  attendanceStatus: 'Yes' | 'Maybe' | 'Cannot attend';
  functionAttendance: Record<string, 'Yes' | 'No'>;
  
  // Personal Travel Details
  personalTravelMode: 'By Flight' | 'By Train' | 'Myself';
  flightTicket?: File;      // For flight mode
  flightPnr?: string;       // For flight mode
  trainTicket?: File;       // For train mode
  trainPnr?: string;        // For train mode
  
  // Guest Counts
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
    // Travel Details for each guest
    travelMode?: 'By Flight' | 'By Train' | 'Myself';
    pnrNumber?: string;
    ticketFile?: File;
    // Government ID Proof for each guest
    govIdType?: string;      // 'Aadhaar Card' | 'Passport' | 'Driving License' | 'Voter ID'
    govIdFile?: File;
  }>;
  
  // Accommodation
  needsAccommodation: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  numberOfRooms?: number;
  roomPreference?: string;
  preferredRoommates?: string;
  
  // ID Proof (Main Guest)
  idType?: string;
  idNumber?: string;
  idFront?: File;
  idBack?: File;
  
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
}
```
  
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
  - `addUser()`, `getUser()`, `getAllUsers()`
  - `addEvent()`, `getEvent()`, `getEvents()`, `deleteEvent()`
  - `addGuest()`, `getGuestsByEvent()`, `getGuests()`
  - `searchEvents()`, `searchGuests()`
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
    - Data accuracy confirmation
    - Privacy & consent checkboxes
- **Pattern:** Step state + form data state + expandedGuests state (for tree view)
- **Validation:** Per-step validation before progression
- **Display:** Guests shown in hierarchical tree format with expandable sections

### 5. **Component Composition Pattern**
- Feature cards in EventDetail that toggle views
- Modal-based guest detail display
- Conditional rendering for different states

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
└─ Messaging
```

### RSVP Form Flow (4 Steps)
```
RSVP Button Click
    ↓
Step 1: Personal Details & Travel Information
├─ Personal Info:
│  ├─ Name, Gender, Mobile, Email
│  ├─ City of Residence
│  ├─ Government ID Proof (Type, Number, Front/Back images)
├─ Travel Details:
│  ├─ Mode of Travel (By Flight / By Train / Myself)
│  ├─ If Flight:
│  │  ├─ Flight PNR Number
│  │  └─ Upload Flight Ticket
│  └─ If Train:
│     ├─ Train PNR Number
│     └─ Upload Train Ticket
    ↓
Step 2: Attendance & Functions
├─ Main attendance status (Yes/Maybe/Cannot attend)
├─ Function-wise attendance (Welcome Lunch, Mehendi, Sangeet, Haldi, Wedding Ceremony, Reception, Farewell Brunch)
    ↓
Step 3: Add Guests (Hierarchical Tree Format)
├─ List main guest (auto-counted)
├─ Add additional guests with:
│  ├─ Basic info (Name, Age, Gender, Relation)
│  ├─ Contact (Mobile, Email)
│  ├─ Travel Details:
│  │  ├─ Mode (By Flight / By Train / Myself)
│  │  ├─ PNR Number (if Flight/Train)
│  │  └─ Upload Ticket (if Flight/Train)
│  └─ Government ID Proof:
│     ├─ ID Type (Aadhaar, Passport, Driving License, Voter ID)
│     └─ Upload ID Proof
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

### Guest List View Flow
```
EventDetail Page
    ↓
Click "Guest List" card
    ↓
showGuestListTable = true
    ↓
Display full-width table with all guest columns:
├─ Name, Email, Mobile, City
├─ Attendance Status, Adults, Children, Infants
├─ Accommodation, Meal Preference
├─ Dietary Restrictions, Special Assistance
├─ Additional Notes, Submission Date
    ↓
Back to Events button
    ↓
showGuestListTable = false
    ↓
Return to feature cards grid
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

### 3. RSVP Collection
- Multi-step form with validation
- Collect personal details & ID proof
- Attendance tracking (single/couple/family)
- Function-wise RSVP (Mehendi, Wedding, Reception, etc.)
- Additional guest management with full details
- Travel information collection
- Accommodation preferences
- Dietary restrictions & special assistance
- Data consent management

### 4. Guest Management
- View all RSVPs for an event
- Full-width guest list table
- Export guest data to Excel (.xlsx)
- View detailed guest information
- Filter by various criteria
- Track guest count statistics

### 5. Data Export
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
- `getGuestsByEvent(eventId)` - Get event's RSVPs
- `getGuests()` - Get all guests across events
- `searchGuests(query)` - Search guests by name

### Data Storage
- **Key Format:** `wedding_rsvp_users`, `wedding_rsvp_events`, `wedding_rsvp_guests`
- **Format:** JSON stringification in localStorage
- **Persistence:** Browser localStorage (max ~5-10MB)

---

## Route Structure

| Path | Component | Auth Required | Purpose |
|------|-----------|---------------|---------|
| `/` | AuthPage | No | Login/Signup |
| `/dashboard` | Dashboard | Yes | Event list & management |
| `/create-event` | CreateEvent | Yes | Create new wedding event |
| `/event/:id` | EventDetail | Yes | Event details, feature cards, guest list |
| `/rsvp/:id` | RSVPForm | Yes | Submit RSVP response |
| `*` | Navigate to `/` | - | Catch-all redirect |

---

## Error Handling

### Form Validation
- Required field validation per step
- Email format validation
- Phone number format check
- Conditional validation based on selections

### Error Display
- Red banner messages for form errors
- Toast-like notifications in forms
- Validation feedback on submission

### User Feedback
- Success confirmation screen after RSVP
- Detailed summary of submitted data
- Loading states during operations

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

### Recommendations
- Add HTTPS enforcement
- Implement JWT tokens
- Server-side authentication
- Data encryption for sensitive info
- GDPR compliance for guest data
- File upload validation

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
| `db.ts` | localStorage CRUD operations |
| `App.tsx` | Route configuration & auth protection |
| `Dashboard.tsx` | Event list & management interface |
| `CreateEvent.tsx` | Event creation form |
| `EventDetail.tsx` | Event details, feature cards, guest list |
| `RSVPForm.tsx` | Multi-step RSVP collection form |

---

## Constants & Configuration

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
  'By Car'
];
```

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

---

**Last Updated:** May 10, 2026  
**Maintainers:** [Project Team]  
**Repository:** Yanikh-Wedding-RSVP
