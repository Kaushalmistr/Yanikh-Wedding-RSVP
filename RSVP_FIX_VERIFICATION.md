# RSVP Flow Fix - Verification & Testing Guide

## What Was Fixed

**Root Cause:** React Router route ordering issue prevented public RSVP links from working correctly.

**The Fix:** Reordered routes in `src/App.tsx` so that the more specific route (`/rsvp/guest/:token`) is evaluated before the generic route (`/rsvp/:id`).

**Before:**
```tsx
<Route path="/rsvp/:id" element={...} />           // Generic - matches anything
<Route path="/rsvp/guest/:token" element={...} />  // Specific - never reached
```

**After:**
```tsx
<Route path="/rsvp/guest/:token" element={...} />  // Specific - evaluated first ✓
<Route path="/rsvp/:id" element={...} />           // Generic - fallback
```

---

## Impact

### What Now Works:
✅ **Public RSVP Links** - Guests can submit RSVPs via public links and be correctly linked to events  
✅ **Event Detection** - Form correctly loads event data from token  
✅ **Guest List Display** - Guests immediately appear in the event's Guest List  
✅ **Admin Links** - Admin authenticated RSVP form still works (`/rsvp/:id`)  
✅ **Data Persistence** - Guest data now includes correct eventId  

### What Was Broken:
❌ **Before Fix:** All public RSVP submissions failed silently (no error message, data not linked to event)

---

## Testing Steps

### 1. **Test Public RSVP Link (PRIMARY TEST)**

**Step 1a: Create an event in the admin panel**
- Login to app
- Go to Dashboard → Create Event
- Fill in details:
  - Groom Name: "John"
  - Bride Name: "Jane"
  - Wedding Date: Any date
  - Venue: "Test Venue"
- Click Create Event

**Step 1b: Get the public RSVP link**
- On event detail page, click "Copy RSVP Link"
- Link format: `https://app.com/#/rsvp/guest/TOKEN123`
- Paste somewhere safe (you'll use this for guest access)

**Step 1c: Test as guest (simulate public access)**
- **Option A - Same browser (incognito window):**
  - Open incognito/private window
  - Paste the RSVP link
  - Form should load with the event displayed at the top
  
- **Option B - Different browser or device:**
  - Have someone open the link or use a different device
  - Form should load correctly

**Step 1d: Check browser console during load**
- Right-click → Inspect → Console tab
- Look for messages like:
  ```
  ✓ Found event in Supabase: John & Jane
  ```
  (or localStorage fallback if Supabase isn't configured)
- **DO NOT see** any "Event not found" errors

**Step 1e: Submit RSVP form**
- Fill Step 1: Personal Info
- Fill Step 2: Travel/ID
- Fill Step 3: Additional Guests (optional)
- Review Step 4
- Click Submit
- Should see success message: "Thank You! RSVP Submitted"

**Step 1f: Verify in Guest List**
- Login to admin account
- Go to Dashboard
- Find the event from Step 1a
- Click "View Guest List"
- **SHOULD SEE:** The guest you just submitted appears in the list with:
  - Name: Matches what was entered
  - Attendance Status: Matches form submission
  - Source: "RSVP Form" (blue badge)

### 2. **Test Admin RSVP Link (REGRESSION TEST)**

**Why:** Ensure we didn't break admin functionality while fixing guest links

**Step 2a: Get admin RSVP link**
- In EventDetail page, the admin can access the RSVP form at `/rsvp/:eventId`
- Or look for "View RSVP Form" or similar button

**Step 2b: Fill and submit**
- Complete RSVP form as admin
- Submit successfully
- Verify guest appears in Guest List

### 3. **Batch Testing (Multiple Guests)**

**Test:** Submit multiple RSVPs via public link to ensure they all appear

- Create new event
- Copy public RSVP link
- Have 3-5 different people submit RSVPs using that link
- Check Guest List - all should appear

### 4. **Console Verification**

**During RSVP submission, check console logs:**

**Should see (good signs):**
```
=== EVENT ID DEBUG ===
id param: undefined
token param: TOKEN123
event object: { id: "uuid-1234", ... }
event.id: uuid-1234
Final eventId to use: uuid-1234

Guest data eventId: uuid-1234

=== CRITICAL: VERIFY EVENT ID SAVED ===
Expected eventId: uuid-1234
Saved guest eventId: uuid-1234
EventIds match: true

Total guests in localStorage: 5
Guests for this event (uuid-1234): 5
```

**Should NOT see (bad signs):**
```
❌ Event not found in Supabase
id param: guest  ← WRONG! Should be undefined
token param: undefined  ← WRONG! Should be the actual token

❌ Guest not found in localStorage
EventIds match: false
Saved guest eventId: null  ← WRONG! Should have UUID
```

---

## Data Flow Verification

### Check localStorage directly:

**Open browser DevTools:**
1. F12 → Application → Local Storage
2. Find key: `wedding_guests`
3. Look at the JSON array

**Correct format (AFTER FIX):**
```json
{
  "id": "guest-uuid-123",
  "eventId": "event-uuid-456",  ← ✓ Should NOT be null
  "name": "Guest Name",
  "email": "guest@example.com",
  ...
}
```

**Wrong format (BEFORE FIX):**
```json
{
  "id": "guest-uuid-123",
  "eventId": null,  ← ✗ PROBLEM: Not linked to event
  "name": "Guest Name",
  ...
}
```

---

## Supabase Verification (if using Supabase)

**Check Supabase dashboard:**
1. Go to Supabase project
2. SQL Editor → Run query:
   ```sql
   SELECT id, event_id, name, email FROM guests;
   ```
3. Verify `event_id` column:
   - Should have UUID values, NOT NULL
   - Should match a valid event from `wedding_events` table

---

## Troubleshooting

### Issue: Guest List still empty after submission

**Check:**
1. Is the guest data saved? (Check localStorage)
   - If not: Document upload issue (check failed docs)
   - If yes: Continue to #2

2. Does guest.eventId match the event.id?
   - In console: Look for "EventIds match: true/false"
   - If false: Fix didn't work properly, check route order in App.tsx

3. Is the guest in Guest List page showing the correct eventId?
   - Component should call: `getGuestsByEvent(eventId)`
   - This filters by matching eventIds

### Issue: "Event not found" message on RSVP form

**Check:**
1. Is the RSVP link correct format? `#/rsvp/guest/TOKEN`
2. Is the token valid? (Check if event exists with that token)
3. Check console for Supabase errors
4. Fallback should work with localStorage

### Issue: Private/Incognito window shows blank

**Reason:** localStorage is not shared between regular and incognito windows
- This is expected browser behavior
- Can verify by using different device or Supabase fallback

---

## Quick Checklist

- [ ] Route order in `src/App.tsx` is correct (specific before generic)
- [ ] `/rsvp/guest/:token` route comes before `/rsvp/:id` route
- [ ] Public link loads event data without error
- [ ] Guest submits RSVP successfully
- [ ] Guest appears in Guest List immediately after submission
- [ ] Console logs show `EventIds match: true`
- [ ] localStorage shows guest with correct eventId (not null)
- [ ] Admin RSVP links still work (`/rsvp/:id`)
- [ ] Multiple guests can submit via same public link
- [ ] All guests appear in Guest List

---

## Expected Behavior After Fix

### Admin Creates Event
1. Goes to Create Event
2. Fills form and creates
3. Gets public link: `https://app.com/#/rsvp/guest/TOKEN123`

### Guest Accesses Public Link
1. Opens link in new browser/device
2. **Correctly sees event data** (Groom, Bride, Date, Venue)
3. Fills RSVP form
4. Submits

### Guest Data Appears
1. Admin goes to Guest List for that event
2. **Immediately sees the guest** in the list
3. Can view guest details, send messages, etc.
4. Guest is linked to the correct event

### No Manual Intervention Needed
- No "sync" button required
- No database cleanup needed
- Just works

---

## Performance Note

Route reordering has **zero performance impact**:
- Specific route is checked first (slightly faster)
- Both routes are equally efficient
- No database changes needed
- No new API calls added

---

## Related Files Modified

- **src/App.tsx** - Route order corrected

**Files That Benefit (no changes needed):**
- src/pages/RSVPForm.tsx - Event loading logic now works correctly
- src/lib/db.ts - Event lookup functions now being called properly
- src/pages/GuestList.tsx - Filter logic now receives guests with correct eventId
- src/pages/EventDetail.tsx - Public link generation unchanged
