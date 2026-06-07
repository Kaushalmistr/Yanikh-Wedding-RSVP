# Public RSVP Flow - Comprehensive Diagnosis & Issues

## Executive Summary

The public RSVP flow has **7 major issues** preventing guests from submitting RSVPs in different browsers/sessions:

1. **❌ Session/Storage Mismatch** - Auth uses sessionStorage, data uses localStorage
2. **❌ Cross-Browser Persistence** - Data doesn't sync across browsers
3. **❌ Incognito Mode Failure** - Data cleared when window closes
4. **❌ No Loading States** - Form freezes while loading event
5. **❌ Storage Quota Errors** - Base64 documents can exceed limits
6. **❌ Silent Failures** - Errors not shown to users
7. **❌ No Error Recovery** - Failed uploads can't be resumed

---

## Issue 1: Session vs Storage Mismatch

### The Problem

**Authentication (sessionStorage):**
```typescript
export function setSession(user: User): void {
  sessionStorage.setItem('wedding_session', JSON.stringify(user));
}
```

**Guest Data (localStorage):**
```typescript
function setItem<T>(key: string, data: T): void {
  localStorage.setItem(key, jsonData); // Different storage!
}
```

### Why This Breaks

| Scenario | Browser A | Browser B | Result |
|----------|-----------|-----------|--------|
| Admin logs in | sessionStorage set | sessionStorage empty | ❌ Not logged in |
| Admin creates event | localStorage gets event | - | ✓ |
| Guest opens link in Browser B | - | Event NOT in localStorage | ❌ "Event not found" |
| Guest fills form in Browser B | - | Saves to localStorage (B) | ❌ Admin in Browser A can't see it |

### Example: Actual User Experience

```
1. Admin logs in (Browser A)
   → sessionStorage['wedding_session'] = user info
   → localStorage['wedding_events'] = [event1, event2]

2. Admin copies public link, sends to guest

3. Guest opens link in Browser B (private/incognito)
   → sessionStorage is EMPTY (new session!)
   → Can access /rsvp/guest/:token (unprotected route) ✓
   
4. Event loads via getEventByRSVPToken()
   → Queries Supabase (might work or timeout)
   → Checks localStorage (empty in incognito!)
   → Event might not load ❌

5. Guest fills form, submits
   → Saves to localStorage (incognito only)
   → Saves to Supabase (if configured correctly)
   
6. Guest closes incognito window
   → localStorage cleared automatically ❌
   
7. Admin checks guest list in Browser A
   → Reads localStorage (still has old events)
   → Guest NOT there because guest data was in INCOGNITO localStorage!
```

---

## Issue 2: Cross-Browser Data Persistence

### The Root Cause

localStorage is **browser-profile specific**:
- Firefox localStorage ≠ Chrome localStorage
- Incognito localStorage ≠ Normal mode localStorage
- Device A localStorage ≠ Device B localStorage

### Current Implementation

```typescript
// RSVPForm.tsx on submission:
const newGuest = await addGuest(guestData);

// db.ts addGuest():
export async function addGuest(guest: Omit<Guest, 'id' | 'submittedAt'>): Promise<Guest> {
  const newGuest: Guest = { ...guest, id: uuidv4(), submittedAt: now() };
  
  // Saves to localStorage only on THIS browser
  const guests = getGuests();
  guests.push(newGuest);
  setItem('wedding_guests', guests);
  
  // Attempts Supabase, but errors silently if fails
  try {
    await supabase.from('guests').insert({...});
  } catch (error) {
    console.error('Supabase save failed'); // Error logged but not shown to user!
  }
  
  return newGuest;
}
```

### Why Supabase Might Fail

1. **Network timeout** - No timeout handling
2. **No auth token** - Public guests aren't authenticated to Supabase
3. **RLS (Row Level Security)** - Supabase policy might reject anonymous inserts
4. **Configuration** - Supabase might not accept inserts to `guests` table

### User Experience

```
Guest submits RSVP
  ↓
Saves to localStorage ✓
  ↓
Tries Supabase (silently fails) ✗
  ↓
Guest sees "Success! RSVP submitted" ✓
  ↓
Incognito window closes
  ↓
localStorage cleared ✗
  ↓
Admin checks guest list
  ↓
Empty list ✗
```

---

## Issue 3: Incognito/Private Mode Failure

### The Scenario

```
Normal Window:
  localStorage persists → Browser restart → Data still there

Incognito/Private Window:
  localStorage temporarily works → Close tab → Data GONE
  
Private Browsing (Firefox):
  localStorage persists → Close ALL private tabs → Data GONE
  
Guest Mode (Chrome):
  localStorage works → Close guest session → Data GONE
```

### Specific Problem in App

```
1. Guest opens /rsvp/guest/TOKEN in incognito
2. Event loads from Supabase or admin's localStorage (neither is visible to guest)
3. Guest fills form with documents
4. Documents converted to base64 (2-5 MB each!)
5. Guest clicks submit
6. Data saves to incognito localStorage
7. Error: "QuotaExceededError" (localStorage limit hit)
   → Guest sees generic error "Failed to save RSVP"
8. Guest is confused: "Did it save? Should I try again?"
9. Guest closes window
10. If it WAS saved to Supabase: ✓ Good
11. If it wasn't saved to Supabase: ❌ Data lost
12. No way to know which one!
```

---

## Issue 4: No Loading States

### Current Code

```typescript
useEffect(() => {
  async function loadEvent() {
    if (token) {
      try {
        const ev = await getEventByRSVPToken(token); // Async operation!
        if (ev) setEvent(ev);
      } catch (err) {
        setError('Failed to load event. Please try again.');
      }
    }
  }
  loadEvent();
}, [token]);

// Render happens immediately, event might still be loading
return (
  <div>
    {event ? (
      // Form content
    ) : (
      <div className="min-h-screen p-6">
        {/* Empty div - user sees blank screen! */}
      </div>
    )}
  </div>
);
```

### User Experience

```
Guest opens link
  ↓
Browser: Loading (network spinner shows)
  ↓
RSVPForm renders with event = null
  ↓
Blank screen for 1-3 seconds ✗
  ↓
Guest might refresh, thinking it's broken
  ↓
Event finally loads
  ↓
Form appears
```

### What Happens on Slow Network

```
Guest on 3G connection
Guest opens /rsvp/guest/TOKEN
getEventByRSVPToken() queries Supabase
Network is slow (2-5 seconds)
User sees blank screen for 5 seconds
User gets frustrated
User refreshes or closes page
Event load completes but page is already navigated away
User never sees form
```

---

## Issue 5: Storage Quota Exceeded

### The Numbers

```
localStorage limit by browser:
- Chrome: 5-10 MB per domain
- Firefox: 10 MB per domain
- Safari: 5 MB per domain
- IE: 10 MB per domain

Each guest's data with documents:
- Guest details: ~1 KB
- ID front image (base64): 1-2 MB
- ID back image (base64): 1-2 MB
- Flight ticket (base64): 0.5-1 MB
- Train ticket (base64): 0.5-1 MB
- General documents: 1-3 MB

Total per guest: 5-10 MB!
```

### Scenario

```
Admin creates event
  → Event saved to localStorage
  → 1 KB used

Guest 1 submits RSVP with 5 documents
  → Guest data with documents saved to localStorage
  → 5-10 MB used
  → Total: 5-10 MB

Guest 2 tries to submit RSVP with 5 documents
  → Code tries to save
  → localStorage.setItem() throws QuotaExceededError
  → Error caught but user sees generic "Failed to save RSVP"
  → Guest is confused ✗
```

### Current Error Handling

```typescript
catch (error) {
  if (error instanceof Error && error.name === 'QuotaExceededError') {
    throw new Error(
      `Storage limit exceeded! Current usage: ${totalMB} MB. ` +
      `Please reduce the number or size of uploaded documents.`
    );
  }
  throw error;
}
```

**Problem**: This error is caught but:
1. User doesn't know quota was exceeded
2. User doesn't know how to reduce file sizes
3. User doesn't get guidance on which files to remove
4. User has no way to recover (no resume mechanism)

---

## Issue 6: Silent Failures

### Supabase Insert Failure Example

```typescript
// Current code in addGuest():
try {
  const { data, error } = await supabase
    .from('guests')
    .insert({...})
    .select()
    .single();

  if (error) {
    console.error('Supabase save FAILED:', error); // Logged but not shown!
    console.warn('Guest will ONLY be saved to localStorage!');
  } else {
    console.log('✅ Guest saved to Supabase successfully!');
  }
} catch (error) {
  console.error('Exception adding guest:', error); // Logged but not shown!
  console.warn('Guest will ONLY be saved to localStorage!');
}

// Even if Supabase fails, addGuest() returns success!
return newGuest; // ← Success returned even if Supabase failed!
```

### User Experience

```
Guest fills form and submits
  ↓
Supabase fails (maybe RLS policy blocks anonymous inserts)
  ↓
Error logged to console (user doesn't see it!)
  ↓
Guest data saved to localStorage
  ↓
Form shows "Success! RSVP submitted" ✓
  ↓
Guest closes browser tab
  ↓
localStorage cleared (was incognito!)
  ↓
Data is permanently lost ✗
  ↓
Admin checks guest list → Nothing there
  ↓
Guest tries to submit again from different device → Can't because form already submitted
```

---

## Issue 7: No Error Recovery

### Current Flow

```
Guest starts filling form in Chrome
  ↓
Fills 4 steps successfully
  ↓
Uploads 5 documents (2-3 MB each)
  ↓
Clicks submit
  ↓
Error: "localStorage quota exceeded"
  ↓
Form still shows error message
  ↓
User has NO option to:
  - Remove specific documents and retry
  - Save partial data and continue later
  - Upload documents in smaller batches
  ↓
User is stuck ✗
```

---

## Root Cause Summary

| Issue | Root Cause | Impact |
|-------|-----------|--------|
| Session mismatch | sessionStorage ≠ localStorage | Can't access data across sessions |
| Cross-browser fail | localStorage is browser-specific | Data not accessible from other device |
| Incognito fail | Incognito localStorage cleared on close | All data lost if Supabase fails |
| No loading state | No loading indicator during async operations | User thinks page is broken |
| Quota exceeded | Base64 documents too large for localStorage | Can't save large uploads |
| Silent failures | Errors logged but not shown to user | User doesn't know what went wrong |
| No recovery | No mechanism to retry or resume | User stuck after error |

---

## Detailed Data Flow (Broken Path)

```
Guest opens /rsvp/guest/TOKEN in Firefox (incognito)
│
├─ App.tsx routes to RSVPForm
│  └─ No auth check (route is public) ✓
│
├─ RSVPForm.tsx useEffect fires
│  ├─ Calls getEventByRSVPToken(token)
│  │  ├─ Queries Supabase: "Find event with rsvp_token = TOKEN"
│  │  │  └─ Might timeout or fail (5-30 second wait)
│  │  ├─ Fallback to localStorage
│  │  │  └─ localStorage is empty in incognito ✗
│  │  └─ Returns event or null
│  │
│  └─ If event found: event state set, form renders ✓
│      If event null: error state set, user sees error ✗
│
├─ Guest fills form (name, mobile, etc.)
│
├─ Guest uploads 5 documents
│  ├─ Each file converted to base64 (2-5 MB each)
│  └─ Total: 10-25 MB in memory
│
├─ Guest clicks submit
│  ├─ RSVPForm.handleSubmit() called
│  ├─ createGuestDocument() runs for each file
│  │  ├─ Validates file
│  │  └─ Converts to base64 string
│  │
│  ├─ addGuest() called with guest data + documents
│  │  ├─ Creates newGuest object with all data
│  │  │
│  │  ├─ Tries Supabase insert:
│  │  │  ├─ POST /rest/v1/guests?select=id
│  │  │  ├─ Headers: Authorization: Bearer [ANON_KEY]
│  │  │  ├─ Body: { id, event_id, name, ..., documents: [{base64 data}] }
│  │  │  │
│  │  │  └─ Response might fail:
│  │  │     ├─ Network timeout ✗
│  │  │     ├─ RLS policy rejects insert ✗
│  │  │     ├─ Payload too large (if documents > 1 MB) ✗
│  │  │
│  │  ├─ Error caught silently:
│  │  │  └─ console.error(...) - user doesn't see this!
│  │  │
│  │  ├─ Falls back to localStorage:
│  │  │  ├─ Tries to localStorage.setItem('wedding_guests', large_data)
│  │  │  ├─ Might throw QuotaExceededError (5 MB limit!) ✗
│  │  │  ├─ Error caught and rethrown with message
│  │  │  └─ User sees generic error "Failed to save RSVP"
│  │  │
│  │  └─ Return: Success or Error
│  │
│  └─ If Success: Form shows success screen ✓
│      If Error: User sees error but can't recover ✗
│
└─ Guest closes incognito window
   └─ Incognito localStorage cleared automatically ✗
      (Even if data WAS saved, it's lost!)
```

---

## Why It Works in Admin Browser

```
Admin logs in (Browser A, normal mode)
  ├─ sessionStorage['wedding_session'] = admin user
  ├─ localStorage is now available for events/guests
  └─ Persistent across page reloads

Admin creates event
  ├─ Event saved to localStorage ✓
  ├─ Attempted save to Supabase (might fail silently)
  └─ Event visible in dashboard ✓

Admin opens /rsvp/:id in same browser
  ├─ Authentication check: isAuthenticated = true ✓
  ├─ Route allows access ✓
  ├─ getEventById(id) reads from localStorage ✓
  ├─ Event loads successfully ✓
  ├─ Form renders ✓
  
Admin fills form (usually without many documents)
  ├─ Fewer documents = smaller localStorage usage
  ├─ Less likely to hit quota limit ✓
  
Admin submits
  ├─ addGuest() saves to localStorage ✓
  ├─ Attempts Supabase (might fail, but admin doesn't care)
  ├─ Form shows success ✓
  
Admin checks guest list
  ├─ GuestList.tsx calls getGuestsByEvent()
  ├─ Reads from localStorage (same browser!) ✓
  ├─ Guest found in list ✓
```

---

## Why It Fails in Different Browser

```
Guest opens link in Chrome (different browser)
  ├─ sessionStorage['wedding_session'] = EMPTY ✗
  ├─ localStorage is DIFFERENT from admin's browser ✗
  ├─ Events not in localStorage ✗
  
Event lookup via getEventByRSVPToken()
  ├─ Queries Supabase (public anon key might not have permission!) ✗
  ├─ Checks localStorage (empty!) ✗
  ├─ Returns null ✗
  
RSVPForm shows error: "Invalid RSVP link"
  └─ But link is actually valid, just not accessible ✗
```

---

## Expected vs Actual

### Expected (What Should Happen)

```
1. Admin creates event anywhere (any browser, any device)
   → Event saved to cloud (Supabase) ✓
   → Event accessible from any browser ✓

2. Guest opens link anywhere (any browser, any device, incognito)
   → Event loads from cloud ✓
   → Form renders ✓

3. Guest fills form and uploads documents
   → Documents validated (size, type) ✓
   → Documents uploaded to cloud storage ✓
   → User sees upload progress ✓

4. Guest submits
   → All data sent to server atomically ✓
   → Server confirms success/failure ✓
   → User sees clear success or error ✓

5. Guest closes browser (any window mode)
   → Data already on server ✓
   → No data loss ✓

6. Admin checks guest list (any browser)
   → Guest visible (loaded from server) ✓
   → Documents accessible (from cloud storage) ✓
```

### Actual (What's Happening Now)

```
1. Admin creates event
   → Event tries to save to Supabase (might fail silently) ✗
   → Event only in admin's localStorage ✗

2. Guest opens link in different browser
   → Event not found ✗
   → User sees "Invalid RSVP link" ✗

3. Guest tries again in incognito
   → Event might load (from Supabase if it was saved)
   → But filling form is risky (will be lost if no Supabase)

4. Guest fills form
   → Documents are base64 encoded (huge!) ✗
   → Stored in localStorage (browser-specific!) ✗

5. Guest submits
   → Might fail with quota error ✗
   → Or silently not save to Supabase ✗
   → User doesn't know what happened ✗

6. Guest closes incognito window
   → localStorage cleared ✗
   → Data lost (unless Supabase saved it) ✗

7. Admin checks guest list
   → Guest not visible (not in localStorage) ✗
   → Might be in Supabase but admin page doesn't check ✗
```

---

## The Fix Strategy

To make public RSVP flow work across browsers, we need to:

1. **Stop relying on localStorage for persistent data** - Use Supabase for everything
2. **Fix Supabase RLS** - Allow anonymous inserts to guests/events tables
3. **Upload documents to cloud storage** - Not base64 in localStorage
4. **Add proper error handling** - Show clear errors to users
5. **Add loading states** - Show feedback during async operations
6. **Add error recovery** - Let users retry or resume
7. **Fix session management** - Use cookies or persistent tokens

---

## Next: Implementation Plan

See RSVP_FIX_IMPLEMENTATION.md for detailed fix instructions
