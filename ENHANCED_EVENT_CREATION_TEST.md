# Enhanced Event Creation Test & Diagnosis

## Issue Summary
Events are NOT being persisted to localStorage when created via the admin dashboard. However, guests ARE being saved correctly with their eventId values.

**Debug Script Output:**
```
Total events in localStorage: 0  ← CRITICAL
Total guests in localStorage: 2  ✓ (with correct eventIds)
```

## Root Cause Investigation

### Code Review Findings
✅ `createEvent()` function in `src/lib/db.ts` looks correct:
- Line 283: Calls `const events = getEvents();`
- Line 284: Calls `events.push(newEvent);`
- Line 285: Calls `setItem('wedding_events', events);`

✅ `setItem()` function is implemented correctly:
- Serializes data to JSON
- Logs save success/failure
- Handles QuotaExceededError

✅ `CreateEvent.tsx` component looks correct:
- Line 50: Correctly calls `await createEvent({...})`
- Line 55: Navigates to dashboard on success

## Test Steps to Diagnose

### Step 1: Manual localStorage Save Test
Copy this into browser console and run:
```javascript
// Test if localStorage.setItem works
const testEvent = {
  id: 'test-' + Date.now(),
  rsvpToken: 'token-' + Date.now(),
  groomName: 'Manual Test Groom',
  brideName: 'Manual Test Bride',
  coupleStory: 'Test',
  weddingDate: '2026-12-25',
  venue: 'Test Venue',
  description: 'Test',
  coverImage: '',
  createdBy: 'test-user',
  createdAt: new Date().toISOString(),
};

const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('Events before:', events.length);
events.push(testEvent);
localStorage.setItem('wedding_events', JSON.stringify(events));

const after = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('Events after:', after.length); // Should show: 1
```

**Expected Result:** Events should go from 0 → 1

### Step 2: Check Browser Console During Event Creation
1. Open browser DevTools → Console tab
2. Look for these log messages:
   ```
   📝 Creating event: [Groom Name] & [Bride Name]
   RSVP Token: [token-value]
   ☁️ Attempting to save to Supabase...
   ✓ Event saved to localStorage
   ```

3. If you see ❌ errors, note them below
4. If you see NONE of these messages, that means `createEvent()` is not being called

### Step 3: Check Network Requests
1. Open DevTools → Network tab
2. Create an event
3. Look for POST request to Supabase (table: `wedding_events`)
4. Check Response tab:
   - If error, note the error code/message
   - If success, verify the event was saved

### Step 4: Verify State After Creation
After creating an event, run this test:
```javascript
// Check if event was saved
const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('Total events:', events.length);
events.forEach(e => {
  console.log(`- ${e.groomName} & ${e.brideName}`);
});

// Also check if Supabase has the event
// (This won't work from console, but you can check the Network tab)
```

## Possible Root Causes

### 1. Supabase Error Blocking localStorage Save
If Supabase fails, the function should STILL save to localStorage (it's outside the try-catch). However, check if there's a silent exception.

### 2. Event Navigation Happening Before localStorage Completes
The `navigate('/dashboard')` happens after `await createEvent()`. But setItem is synchronous, so this shouldn't be an issue.

### 3. localStorage Disabled or Quota Exceeded
- Private/Incognito mode might restrict localStorage
- Storage quota might be exceeded (check Step 1 test)

### 4. Race Condition or Async Issue
The function is async, but `setItem` is synchronous, so timing shouldn't be an issue.

### 5. Type Mismatch or Serialization Error
The WeddingEvent type might have non-serializable data (like Dates, Functions, etc.)

## Quick Fix Tests

### Test A: Bypass Supabase, Force localStorage Only
Add this temporary code to `src/lib/db.ts` after line 256:
```typescript
console.warn('🔧 DEBUG MODE: Forcing localStorage save to verify it works');
const events = getEvents();
events.push(newEvent);
setItem('wedding_events', events);
console.log(`📊 Events now in storage: ${events.length}`);
return newEvent;
```

Then test event creation. If this works, the issue is with Supabase operations blocking the function.

### Test B: Add console.trace to setItem
Add this to `src/lib/db.ts` in the `setItem` function:
```typescript
console.trace('🔍 setItem called for key:', key);
console.log('Stack trace above shows where save was triggered');
```

This will help us see if setItem is even being called.

## Next Steps
1. Run manual localStorage save test (Step 1) - verify localStorage itself works
2. Check browser console during event creation (Step 2) - verify function is called
3. Run Verify State test (Step 4) - confirm data isn't being saved
4. If all tests show data isn't saving, run Test A to bypass Supabase
5. If Test A works but normal flow doesn't, check Supabase errors in Network tab

## Expected Behavior After Fix
1. Create event in admin dashboard
2. See console logs showing event is created
3. See event appears in localStorage
4. Dashboard refreshes
5. Event appears in events list
6. Guest List for that event shows any RSVP submissions
