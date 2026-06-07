# 🧪 TEST THE FIX NOW (5 Minutes)

## What Was Fixed
Events now save to localStorage (primary) + Supabase (backup).

**Result:** Dashboard shows events immediately!

## Quick Test (5 minutes)

### Preparation (1 minute)

```javascript
// Run this in browser console to clear old data:
localStorage.clear();
location.reload();
```

Wait for page to reload.

### Test 1: Create Event (2 minutes)

1. Click **"Create New Event"** button
2. Fill the form:
   ```
   Groom's Name: John Doe
   Bride's Name: Sarah Smith
   Wedding Date: Pick any date (e.g., 2026-12-25)
   Venue: New York
   ```
3. Leave other fields blank (optional)
4. Click **"Create Wedding Event 💒"** button
5. Watch console - you should see:
   ```
   ✅ CRITICAL SUCCESS: Event saved to localStorage
      Dashboard can now see this event!
   ```

### Test 2: Check Dashboard (1 minute)

After creation, you should be on Dashboard automatically.

✅ **EXPECTED:** You see the event card with "John Doe & Sarah Smith"

❌ **IF NOT:** Try refreshing page (F5)

### Test 3: Check Guest List (1 minute)

1. Click the event card
2. Look for "Guest List" button/tab
3. It should be empty (no RSVPs yet)
4. Good! This proves the event was found

### QUICK TEST COMPLETE ✅

If you got here with the event showing, the fix works!

---

## Full Test (10 minutes)

Want to test the complete flow?

### Step 1: Create Event ✓ (Done above)

### Step 2: Get RSVP Link (1 minute)

1. On the event page, look for "RSVP Link" or "Share" button
2. Copy the link
3. Example: `http://localhost:5173/rsvp/guest/0d8ebc3a-154b-4e20-bb46-b0f7e83f4feb`

### Step 3: Test RSVP Form (3 minutes)

1. **Open RSVP link in new window/tab** (or incognito for better test)
2. Fill form:
   ```
   Name: Kaushal
   Mobile: +1 1234567890
   Email: test@example.com
   City: Any City
   Attending: Yes
   ```
3. Click **"Submit RSVP"**
4. Should see success message ✅

### Step 4: Check Guest List (1 minute)

1. Go back to event page
2. Click **"Guest List"** tab
3. Should show **"Kaushal"** in the guest list ✅

### FULL TEST COMPLETE ✅

If you got here with the guest showing, the fix works perfectly!

---

## What to Look For in Console

### Good Signs ✅
```
✅ CRITICAL SUCCESS: Event saved to localStorage
   Dashboard can now see this event!

✅ Event also saved to Supabase (cloud backup)
   Event will sync across devices

✓ Guest saved to localStorage
```

### Warning Signs (Still OK) ⚠️
```
⚠️ Supabase save failed (but event is safe in localStorage)
   Event will work in this browser
```
This is fine - event still works, just no cloud sync.

### Error Signs ❌
```
❌ CRITICAL FAILURE: Could not save to localStorage
```
This should NOT happen. If it does, screenshot and share.

---

## If Test Fails

### Dashboard Shows "No Events"
**Problem:** Event not in localStorage

**Check:**
1. Did you see `✅ CRITICAL SUCCESS` in console?
2. Run in console: `JSON.parse(localStorage.getItem('wedding_events')).length`
   - Should show: `1` (or higher)
   - If `0`: event not saved

**Fix:**
1. Refresh page (F5)
2. Try creating event again
3. Watch console carefully for the SUCCESS message

### Event Shows But Guest List Is Empty
**This is OK!** Guest list is empty until you submit an RSVP. This is normal.

**To test:**
1. Get RSVP link
2. Submit RSVP form
3. Go back to guest list
4. Guest should appear

### RSVP Form Doesn't Open
**Problem:** Event not found via RSVP link

**Check:**
1. Is the link correct? (Check it was copied fully)
2. Run in console: `JSON.parse(localStorage.getItem('wedding_events')).length`
   - Should be: `1` or higher
3. Is event in Supabase? (Check browser Network tab)

### Guest List Still Empty After RSVP
**Problem:** Guest wasn't saved

**Check:**
1. Run in console: `JSON.parse(localStorage.getItem('wedding_guests')).length`
   - Should be: at least `1`
2. Check console for errors during RSVP submit
3. Try refreshing guest list page

---

## Success Criteria

| Test | Expected | Status |
|------|----------|--------|
| Create event | Appears in dashboard | [ ] Pass |
| Event visible | Card shows couple names | [ ] Pass |
| Guest list loads | Can click into event | [ ] Pass |
| RSVP link works | Form opens | [ ] Pass |
| RSVP submit works | No error message | [ ] Pass |
| Guest appears | Shows in guest list | [ ] Pass |
| Works in incognito | No special handling | [ ] Pass |

If 6/7 pass, the fix works! ✅

---

## Console Commands for Debugging

### Check events saved
```javascript
JSON.parse(localStorage.getItem('wedding_events') || '[]').length
```

### Check guests saved
```javascript
JSON.parse(localStorage.getItem('wedding_guests') || '[]').length
```

### List all events
```javascript
JSON.parse(localStorage.getItem('wedding_events') || '[]').forEach(e => {
  console.log(`${e.groomName} & ${e.brideName} - ID: ${e.id}`);
});
```

### Find guests for specific event
```javascript
const eventId = '6750e731-f0e7-4c22-ba69-e819023a603b'; // Replace with your event ID
const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
const guestsForEvent = guests.filter(g => g.eventId === eventId);
console.log(`Found ${guestsForEvent.length} guests for event`);
```

### Clear all data (fresh start)
```javascript
localStorage.clear();
location.reload();
```

---

## Report Your Results

After testing, tell me:

```
✅ Test Results:

[ ] Dashboard shows event after creation: Yes / No
[ ] Event card displays correctly: Yes / No
[ ] Guest List page loads: Yes / No
[ ] RSVP link works: Yes / No
[ ] RSVP form submits: Yes / No
[ ] Guest appears in list: Yes / No
[ ] Works in incognito: Yes / No

Console logs show:
✅ CRITICAL SUCCESS or ⚠️ Warning?

Any errors? (Copy from console)
```

---

## Next Steps

1. **Do the Quick Test** (5 minutes)
2. **Report if it works**
3. **If works:** Issue is FIXED! 🎉
4. **If fails:** Share error details and I'll debug

**Let's test it!** 🚀
