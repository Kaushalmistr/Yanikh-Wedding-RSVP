# ROOT CAUSE IDENTIFIED & SOLUTION

## The Problem

### Root Cause Analysis
The app uses **hybrid storage**:
- Events are stored in BOTH Supabase (cloud) and localStorage (browser)
- **Dashboard & Guest List** → Only read from localStorage via `getEventById()`
- **RSVP Form** → Reads from Supabase first, falls back to localStorage via `getEventByRSVPToken()`
- **Guests** → Always saved to localStorage

**Current Behavior:**
```
1. Admin creates event
   ↓
2. createEvent() tries to save to Supabase AND localStorage
   ↓
3. If Supabase fails, event might not reach localStorage
   ↓
4. Dashboard shows 0 events (because it only reads localStorage)
   ↓
5. RSVP link still works (because it checks Supabase)
   ↓
6. Guests save RSVPs to localStorage (with eventId)
   ↓
7. Guest List can't find event (because it only searches localStorage)
```

This matches your debug output exactly:
```
Total events in localStorage: 0  ← Dashboard can't see events
Total guests in localStorage: 2  ← But guests ARE being saved
```

## The Solution

### Architecture: Make Everything Work from localStorage (Primary)
Instead of trying to sync with Supabase (which may be slow or failing), use:
1. **localStorage** as the primary source of truth
2. **Supabase** as optional cloud backup (for data persistence)

### Fix 1: Ensure createEvent ALWAYS saves to localStorage
The current code tries Supabase first, then localStorage. We need to guarantee localStorage gets the event regardless of Supabase status.

**Key Change:**
```typescript
export async function createEvent(event: ...): Promise<WeddingEvent> {
  const newEvent = { ... };
  
  // Always save to localStorage first (guaranteed)
  const events = getEvents();
  events.push(newEvent);
  setItem('wedding_events', events);  // This MUST succeed
  
  // Then try Supabase (optional, for cloud backup)
  try {
    await supabase.from('wedding_events').insert({ ... });
  } catch (error) {
    console.warn('Supabase save failed, but event saved to localStorage');
  }
  
  return newEvent;
}
```

### Fix 2: Make getEventById check Supabase too (for data recovery)
If an event is in Supabase but not localStorage (e.g., from another device):
```typescript
export function getEventById(id: string): WeddingEvent | undefined {
  // Try localStorage first (primary source)
  let event = getEvents().find(e => e.id === id);
  if (event) return event;
  
  // If not found, you could load from Supabase
  // (This would be async, so needs refactor of caller)
  
  return undefined;
}
```

### Fix 3: Ensure addGuest always has the event
When a guest submits RSVP:
```typescript
export function addGuest(guest: ...) {
  // Ensure the event exists before saving guest
  const events = getEvents();
  if (!events.find(e => e.id === guest.eventId)) {
    console.warn('Event not found in localStorage:', guest.eventId);
    // Could try to load from Supabase here
  }
  
  const guests = getGuests();
  guests.push(guest);
  setItem('wedding_guests', guests);
}
```

## Implementation Plan

### Phase 1: Fix Event Persistence (PRIORITY)
1. ✅ Add detailed logging to createEvent (DONE)
2. ✅ Add detailed logging to setItem (DONE)
3. Verify localStorage.setItem works in tests
4. Fix any race conditions

### Phase 2: Verify Guest List Works
1. Ensure getEventById searches localStorage
2. Guest list component loads guests for found events
3. Test: Create event → Submit RSVP → Guest appears in list

### Phase 3: Add Supabase Recovery (Optional)
1. If event missing from localStorage but in Supabase
2. Load event from Supabase and sync to localStorage
3. This handles cross-device and persistence scenarios

## Tests to Run

### Test 1: Direct localStorage Test
```javascript
// In browser console
const testEvent = {
  id: 'test-1',
  rsvpToken: 'token-1',
  groomName: 'Test Groom',
  brideName: 'Test Bride',
  coupleStory: '',
  weddingDate: '2026-12-25',
  venue: 'Test',
  description: '',
  coverImage: '',
  createdBy: '',
  createdAt: new Date().toISOString(),
};

const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('Before:', events.length);
events.push(testEvent);
localStorage.setItem('wedding_events', JSON.stringify(events));
const after = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('After:', after.length); // Should be +1
```

### Test 2: Event Creation Flow
1. Open browser DevTools → Console
2. Click "Create Event" button
3. Fill form and submit
4. Watch console for logs:
   - `🚀 createEvent STARTED`
   - `📝 Creating event:`
   - `💾 Starting localStorage save...`
   - `✅ SUCCESS: Event saved to localStorage`
5. Check if event appears in Dashboard

### Test 3: Guest List Flow
1. Create event (from Test 2)
2. Get RSVP link from event
3. Open RSVP form, submit guest RSVP
4. Open Guest List
5. Should show guest details

## Files That Need Changes
- `src/lib/db.ts`: `createEvent()` - DONE (logging added, needs verification)
- `src/lib/db.ts`: `setItem()` - DONE (logging added)
- `src/pages/CreateEvent.tsx`: Maybe nothing needed (should work once createEvent is fixed)
- `src/pages/GuestList.tsx`: Should work once events persist

## Expected Outcome After Fix
✅ Admin creates event → appears in Dashboard
✅ Admin gets RSVP link → works in any browser
✅ Guest submits RSVP → data saves immediately
✅ Guest appears in Guest List automatically
✅ Works in incognito/private mode
✅ Works across browsers (if Supabase sync implemented)
