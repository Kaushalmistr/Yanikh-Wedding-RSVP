# RSVP Cross-Session Fix - Implementation Guide

## Problem
The RSVP link only worked in the current browser session. Opening the same link in incognito mode or a different browser failed to display the RSVP form because all data was stored in localStorage.

## Solution
Migrated the data layer from localStorage to Supabase database to enable cross-session, cross-device access.

## Changes Made

### 1. Database Schema Created
- **File**: `supabase/migrations/001_initial_schema.sql`
- **Tables Created**:
  - `users` - User accounts
  - `wedding_events` - Wedding events with RSVP tokens
  - `guests` - Guest RSVP submissions
  - `bulk_messages` - Bulk messaging data
  - `uploaded_guest_lists` - Guest list uploads
- **Features**:
  - Row Level Security (RLS) policies for public RSVP access
  - Indexes for optimized queries
  - Foreign key relationships

### 2. Database Functions Updated

#### `src/lib/db.ts`
- Added Supabase client import
- **`getEventByRSVPToken()`**: Now async, queries Supabase first, falls back to localStorage
- **`createEvent()`**: Now async, saves to both Supabase and localStorage
- **`addGuest()`**: Now async, saves to both Supabase and localStorage

### 3. Component Updates

#### `src/pages/RSVPForm.tsx`
- Updated `useEffect` to handle async `getEventByRSVPToken()`
- Updated `handleSubmit` to await `addGuest()`
- Added error handling for async operations

#### `src/pages/CreateEvent.tsx`
- Updated `handleSubmit` to await `createEvent()`
- Added error handling for async operations

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)
1. Go to https://tecxwucnhtntoatbywcq.supabase.co
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `supabase/migrations/001_initial_schema.sql`
5. Paste into the query editor
6. Click **Run** to execute the migration

### Option 2: Using Supabase CLI (if installed)
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Run the migration
cd "Yanikh-Wedding-RSVP"
supabase db push
```

### Option 3: Manual SQL Execution
1. Open `supabase/migrations/001_initial_schema.sql`
2. Copy the SQL content
3. Run it in your Supabase project's SQL editor

## Testing the Fix

### Test 1: Create Event in Normal Browser
1. Start the development server: `npm run dev`
2. Open http://localhost:5173 in your browser
3. Log in or create an account
4. Create a new wedding event
5. Copy the RSVP link from the event details

### Test 2: Open RSVP Link in Incognito Mode
1. Open a new **Incognito/Private window**
2. Paste the RSVP link
3. **Expected Result**: The RSVP form should load correctly
4. Fill out the form and submit
5. **Expected Result**: Submission should succeed

### Test 3: Open RSVP Link on Different Device
1. Copy the RSVP link
2. Open it on a different device or browser
3. **Expected Result**: The RSVP form should load and work correctly

### Test 4: Verify Data in Supabase
1. Go to Supabase Dashboard → Table Editor
2. Check `wedding_events` table - should see your events
3. Check `guests` table - should see submitted RSVPs

## Data Migration (Optional)

If you have existing events in localStorage that you want to migrate to Supabase:

### Manual Migration Script
```javascript
// Run this in browser console on the app
async function migrateLocalStorageToSupabase() {
  const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
  
  // Migrate events
  for (const event of events) {
    const { error } = await supabase.from('wedding_events').insert({
      id: event.id,
      rsvp_token: event.rsvpToken,
      groom_name: event.groomName,
      bride_name: event.brideName,
      couple_story: event.coupleStory,
      wedding_date: event.weddingDate,
      venue: event.venue,
      description: event.description,
      cover_image: event.coverImage,
      created_by: event.createdBy,
      created_at: event.createdAt,
    });
    if (error) console.error('Error migrating event:', error);
    else console.log('Migrated event:', event.id);
  }
  
  // Migrate guests
  for (const guest of guests) {
    const { error } = await supabase.from('guests').insert({
      id: guest.id,
      event_id: guest.eventId,
      name: guest.name,
      country_code: guest.countryCode,
      mobile: guest.mobile,
      email: guest.email,
      city: guest.city,
      responding_for: guest.respondingFor,
      attendance_status: guest.attendanceStatus,
      function_attendance: guest.functionAttendance,
      adults: guest.adults,
      children: guest.children,
      infants: guest.infants,
      additional_guests: guest.additionalGuests,
      // ... (include all other fields)
      submitted_at: guest.submittedAt,
      documents: guest.documents,
    });
    if (error) console.error('Error migrating guest:', error);
    else console.log('Migrated guest:', guest.id);
  }
  
  console.log('Migration complete!');
}

// Run the migration
migrateLocalStorageToSupabase();
```

## Backward Compatibility

The implementation maintains backward compatibility:
- Data is saved to **both** Supabase AND localStorage
- If Supabase query fails, falls back to localStorage
- Existing localStorage data continues to work

## Next Steps

1. **Apply the migration** using one of the methods above
2. **Test the RSVP link** in incognito mode
3. **Optionally migrate** existing localStorage data
4. **Monitor** Supabase dashboard for successful data storage

## Rollback Plan

If you need to rollback:
1. The code still uses localStorage as fallback
2. To remove Supabase tables: Run `DROP TABLE` commands in SQL editor
3. Revert code changes using git: `git checkout HEAD~1`

## Support

If you encounter any issues:
1. Check Supabase Dashboard → Logs for error messages
2. Check browser console for JavaScript errors
3. Verify `.env` file has correct Supabase credentials
4. Ensure RLS policies are correctly applied
