# RSVP Submission Flow Investigation - Root Cause Analysis

## Problem Statement
When guests submit RSVP forms via a public event link, their details are not appearing in the corresponding event's Guest List page.

---

## Root Cause Identified

### **Issue: Incorrect Route Parameter Order in React Router**

**Location:** `src/App.tsx` (routes 45-57)

```tsx
// PROBLEMATIC ROUTING ORDER
<Route
  path="/rsvp/:id"
  element={
    <ProtectedRoute>
      <RSVPForm />
    </ProtectedRoute>
  }
/>
<Route
  path="/rsvp/guest/:token"
  element={<RSVPForm />}
/>
```

**The Problem:**
- React Router evaluates routes in order and uses the **first match**
- The route `/rsvp/:id` matches the pattern `/rsvp/guest/:token` because:
  - `/rsvp/guest/some-token` is captured as `/rsvp/:id` where `:id = "guest"`
  - The second route `/rsvp/guest/:token` is **never reached**

**Result:**
- Public guests access `/rsvp/guest/TOKEN123` 
- It gets matched to `/rsvp/:id` with `id="guest"` (the literal string, not the token)
- The `token` parameter is never populated
- In `RSVPForm.tsx`, the `loadEvent()` function:
  ```tsx
  if (id) {
    const ev = getEventById(id);  // Tries to find event with id="guest" - FAILS
  } else if (token) {
    // Never executed because id="guest"
    const ev = await getEventByRSVPToken(token);
  }
  ```
- No event is loaded (`event = null`)
- Guest submits RSVP with `eventId: null` or undefined
- Guest is NOT linked to the event
- Guest does NOT appear in Guest List for that event

---

## The Complete Data Flow Problem

### Current (Broken) Flow:
```
Guest opens public link: 
  https://app.com/#/rsvp/guest/TOKEN123
                          ↓
Router matches /rsvp/:id pattern first
  :id = "guest" (captured from path segment)
  :token = undefined (never captured)
                          ↓
RSVPForm.useEffect tries:
  if (id) → id = "guest"
    getEventById("guest") → returns undefined (no event has id "guest")
                          ↓
  event = null
                          ↓
Guest fills form and submits with:
  eventId: undefined or null
  name: "John Doe"
  ...other data
                          ↓
Guest saved to localStorage but NOT linked to event:
  {
    id: "uuid",
    eventId: null,  // ← PROBLEM: Should be the actual event ID
    name: "John Doe"
  }
                          ↓
GuestList.tsx calls:
  getGuestsByEvent(eventId) → filters guests where g.eventId === eventId
  
  Since guest.eventId is null and eventId is valid UUID:
    null !== "valid-uuid" → Guest is FILTERED OUT
                          ↓
Guest does NOT appear in Guest List
```

### Expected (Fixed) Flow:
```
Guest opens public link:
  https://app.com/#/rsvp/guest/TOKEN123
                          ↓
Router matches /rsvp/guest/:token pattern (routes reordered)
  :token = "TOKEN123" (correctly captured)
  :id = undefined
                          ↓
RSVPForm.useEffect tries:
  if (id) → false (id is undefined)
  else if (token) → true
    getEventByRSVPToken("TOKEN123")
      → Queries wedding_events table
      → Finds event with rsvp_token = "TOKEN123"
      → Returns event { id: "event-uuid", rsvpToken: "TOKEN123", ... }
                          ↓
  event = { id: "event-uuid", ... }
                          ↓
Guest fills form and submits with:
  eventId: "event-uuid"  // ← CORRECT: Event is properly linked
  name: "John Doe"
  ...other data
                          ↓
Guest saved to localStorage LINKED to event:
  {
    id: "uuid",
    eventId: "event-uuid",  // ← CORRECT: Matches the event
    name: "John Doe"
  }
                          ↓
GuestList.tsx calls:
  getGuestsByEvent("event-uuid")
    → Filters guests where g.eventId === "event-uuid"
    → FOUND: Guest { eventId: "event-uuid" } ✓
                          ↓
Guest APPEARS in Guest List ✓
```

---

## Secondary Issues

### 1. **Event Loading Fallback**
In `RSVPForm.tsx` line 550:
```tsx
const finalEventId = event?.id || id || '';
```

If `event` is null (because event lookup failed), the code falls back to `id`, which would be "guest" (wrong).

**Impact:** Even if somehow event lookup succeeded, the fallback logic compounds the problem.

### 2. **No Visual Feedback to Guest**
The current code doesn't provide clear feedback to the guest about the error:
```tsx
else if (token) {
  try {
    const ev = await getEventByRSVPToken(token);
    if (ev) {
      setEvent(ev);
    } else {
      setError('Invalid RSVP link. Please check the link and try again.');
    }
  }
}
```

However, this code is **never executed** due to the routing issue.

---

## Why This Wasn't Caught Earlier

1. **Route Order Matters:** React Router is order-sensitive, but this isn't always obvious from code review
2. **Testing Gap:** Testing only with admin RSVP form (`/rsvp/:id`) would pass
3. **Silent Failure:** No error thrown; guest just appears to submit successfully, but data vanishes
4. **localStorage as Fallback:** Guests submitted data to localStorage, but without eventId link

---

## Solution

### Fix: Reorder Routes in src/App.tsx

**Change from:**
```tsx
<Route path="/rsvp/:id" element={<ProtectedRoute><RSVPForm /></ProtectedRoute>} />
<Route path="/rsvp/guest/:token" element={<RSVPForm />} />
```

**Change to:**
```tsx
<Route path="/rsvp/guest/:token" element={<RSVPForm />} />
<Route path="/rsvp/:id" element={<ProtectedRoute><RSVPForm /></ProtectedRoute>} />
```

**Why this works:**
- `/rsvp/guest/:token` is more specific (has literal "guest" segment)
- `/rsvp/:id` is more general (accepts any value for `:id`)
- React Router matches specific routes before generic ones
- Now `/rsvp/guest/TOKEN123` correctly captures `token="TOKEN123"`
- And `/rsvp/admin-id-123` still matches `/rsvp/:id` with `id="admin-id-123"`

---

## Verification Steps

After fix:
1. Create an event in admin panel
2. Copy the public RSVP link (generated from `eventDetail.tsx`)
3. Submit RSVP form via public link
4. Check browser console - should see:
   ```
   ✓ Found event in Supabase: [Groom] & [Bride]
   ✅ Event loaded successfully for public link
   ```
5. After submission, verify guest appears in Guest List
6. Check localStorage:
   ```
   wedding_guests → Find guest with eventId = actual-event-uuid (not null)
   ```

---

## Files Involved

- **src/App.tsx** - Route definition (THE FIX)
- **src/pages/RSVPForm.tsx** - Event loading logic (detects issue via null event)
- **src/lib/db.ts** - Event lookup by token (working correctly)
- **src/pages/EventDetail.tsx** - Generates public RSVP link
- **src/pages/GuestList.tsx** - Filters guests by eventId (correct logic, just no matching guests)

---

## Impact of This Bug

- ❌ **Zero RSVPs recorded** via public links (they all fail to link to event)
- ❌ **Event organizers see empty Guest Lists** despite receiving submissions
- ❌ **Guests believe they submitted successfully** (no error message shown)
- ✓ **Admin RSVP submissions work fine** (use `/rsvp/:id` which works with auth)
- ✓ **Supabase integration unaffected** (guest data saved but unlinked)
- ✓ **Document handling unaffected** (base64 conversion works correctly)
