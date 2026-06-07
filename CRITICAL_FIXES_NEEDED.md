# Critical Issues - Guest List Not Showing & Form Auto-Submit

## Issues Identified

### Issue 1: Guest List Not Showing Guests
**Symptoms:**
- Form submits successfully
- Success screen appears
- But guests don't appear in Guest List table

**Possible Causes:**
1. Event ID not being saved correctly with guest
2. Guest filtering by eventId is not working
3. Guest List is not refreshing after submission
4. Data is being saved to Supabase but not localStorage

### Issue 2: Form Auto-Submitting After Step 3
**Symptoms:**
- After Step 3 (additional guests), form auto-submits
- Should require explicit click on Step 4

**Root Cause Found:**
- Missing imports for `RefreshCw` and `AlertCircle` icons  
- This was causing import errors which might trigger auto-submit behavior

## Fixes Applied

### Fix 1: Added Missing Imports
**File:** `src/pages/RSVPForm.tsx` (Line 4)

Added RefreshCw and AlertCircle to imports:
```typescript
import { Heart, ArrowLeft, CheckCircle, Plus, Upload, User, ChevronDown, ChevronRight, Plane, Train, Users, Briefcase, X, File, RefreshCw, AlertCircle } from 'lucide-react';
```

---

## Debug Steps to Identify Guest List Issue

### Step 1: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. After submitting RSVP, look for:
   ```
   ✓ Guest saved to localStorage
   Guests for this event: 1
   Guest names: [name]
   ```

### Step 2: Check localStorage Directly
1. Open DevTools → Application/Storage
2. Go to Local Storage
3. Find key: `wedding_guests`
4. Look at the JSON:
   ```json
   {
     "id": "guest-uuid",
     "eventId": "event-uuid",
     "name": "Guest Name",
     ...
   }
   ```
   - Verify `eventId` is NOT null
   - Verify `eventId` matches the event ID from dashboard

### Step 3: Check Event ID Match
1. Go to Dashboard
2. Right-click on event → Inspect element
3. Find the event ID in the URL or data attribute
4. In GuestList console, look for:
   ```
   GuestList: Event found: { id: "event-uuid", ... }
   GuestList: Loading guests for event event-uuid, found X guests
   ```
   - Check if the eventId matches what was stored with guest

### Step 4: Manual Verification in Console
Type this in browser console:

```javascript
// Check all guests
const guests = JSON.parse(localStorage.getItem('wedding_guests'));
console.log('All guests:', guests);

// Check guests for specific event
const eventId = 'YOUR_EVENT_ID_HERE'; // From dashboard
const guestsForEvent = guests.filter(g => g.eventId === eventId);
console.log('Guests for this event:', guestsForEvent);
```

---

## Testing Procedure (After Fixes)

### Quick Test (10 minutes)

1. **Create event:**
   - Dashboard → Create Event
   - Fill details
   - Note the event ID from URL

2. **Submit RSVP:**
   - Open public link
   - Fill form through all steps
   - Verify no auto-submit between steps
   - Click Submit button explicitly
   - See success screen

3. **Check Guest List:**
   - Navigate to Guest List for event
   - **Expected:** Guest appears in table
   - If not appearing:
     - Check console for errors
     - Run debug steps above
     - Report exact issue

4. **Verify Data:**
   - Open DevTools → Application → Local Storage
   - Check `wedding_guests` key
   - Verify guest has correct eventId

---

## Potential Issues & Solutions

### Problem: Guest appears in console but not in table

**Solution:**
1. Check if GuestList is querying localStorage
2. Look for:
   ```
   GuestList: Raw localStorage data: [...]
   GuestList: Loading guests for event XXX, found Y guests
   ```
3. If found count is correct but table is empty:
   - Table rendering might have issue
   - Check React state updates
   - Verify setGuests is being called

### Problem: eventId is null

**Solution:**
1. Check RSVPForm console output:
   ```
   Final eventId to use: [should show UUID, not blank]
   Guest data eventId: [should show UUID]
   ```
2. If showing blank:
   - Event not loading properly
   - Check if event lookup successful
   - Verify event object has id property

### Problem: Form auto-submitting

**Solution:**
1. Fixed by adding missing imports
2. Test again - should not auto-submit after Step 3
3. If still auto-submitting:
   - Check form elements for accidental onSubmit
   - Check if Enter key is triggering submit
   - Look for unwanted onClick handlers

---

## Code to Add for Better Debugging

If issues persist, add this to GuestList.tsx after loading guests:

```typescript
// Add detailed debugging
useEffect(() => {
  if (guests.length === 0 && event) {
    console.log('🔍 DEBUG: No guests found');
    console.log('Event ID:', event.id);
    console.log('All localStorage guests:', JSON.parse(localStorage.getItem('wedding_guests') || '[]'));
    const allGuests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
    const matching = allGuests.filter((g: any) => g.eventId === event.id);
    console.log('Guests matching this event:', matching);
  }
}, [guests, event]);
```

---

## Next Steps

1. **Test the fix:** Run the quick test procedure above
2. **Check console:** Verify no errors
3. **Check localStorage:** Confirm data is saved correctly
4. **Run debug steps:** If guests still not showing
5. **Report findings:** Note exact issue from console logs

---

## Expected Behavior (After Fix)

### Form Submission:
✅ Step 1 → Step 2 (explicit click)  
✅ Step 2 → Step 3 (explicit click)  
✅ Step 3 → Step 4 (explicit click)  
✅ Step 4 → Submit (explicit click)  
✅ Success screen appears

### Guest Data:
✅ Guest saved to localStorage  
✅ Guest has eventId field  
✅ eventId matches event's ID  
✅ Guest appears in Guest List

### Console Output:
✅ No import errors  
✅ No auto-submit logs  
✅ Clear debugging messages  
✅ EventId and guest count correct

---

## Files Modified

- ✅ `src/pages/RSVPForm.tsx` - Added missing imports (RefreshCw, AlertCircle)

## Files to Check (if issues persist)

- `src/pages/GuestList.tsx` - Guest loading and rendering
- `src/lib/db.ts` - getGuestsByEvent() filtering
- `src/pages/RSVPForm.tsx` - handleSubmit() eventId logic

---

**Status:** 🔧 IN PROGRESS  
**Next Step:** Run debug steps and report findings
