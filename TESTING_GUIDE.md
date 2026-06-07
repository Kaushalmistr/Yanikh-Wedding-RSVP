# Testing Steps - RSVP Cross-Session Fix

## Issue Summary
The screenshots showed two errors:
1. **Image 1**: Column name mismatch when migrating localStorage to Supabase
2. **Image 2**: "Invalid RSVP link" error in incognito mode

## Fixes Applied

### 1. Fixed Column Name Mapping
- Updated `addGuest()` to properly handle null/undefined values with fallbacks
- Updated `migrateLocalStorageToSupabase()` with same null handling
- Changed `.single()` to `.maybeSingle()` in RSVP token lookup to avoid errors

### 2. Enhanced Error Logging
- Added detailed console logging to track event lookup
- Shows whether event is found in Supabase or localStorage

## Testing Instructions

### Step 1: Clear Browser Console Errors
```javascript
// Open browser console (F12)
console.clear()
```

### Step 2: Test Migration (If You Have Existing Data)
```javascript
// Run migration again with fixed code
await migrateLocalStorageToSupabase()

// Expected output:
// ✓ Found X events in localStorage
// ✓ Migrated event: [Groom] & [Bride]
// ✓ Found X guests in localStorage  
// ✓ Migrated guest: [Name]
// ✅ Migration complete!
```

### Step 3: Create a New Test Event
1. Open the app in normal browser mode
2. Log in or create account
3. Create a new wedding event
4. Copy the RSVP link (should look like: `http://localhost:5173/#/rsvp/guest/abc123xyz`)

### Step 4: Test in Incognito Mode
1. Open a **new incognito/private window**
2. Paste the RSVP link
3. Open browser console (F12)
4. Watch for console messages:
   ```
   Looking up RSVP token: abc123xyz
   ✓ Found event in Supabase: [Groom] & [Bride]
   ```
5. **Expected Result**: RSVP form loads successfully

### Step 5: Fill Out RSVP Form
1. Fill in all required fields
2. Submit the form
3. Watch console for:
   ```
   ✓ Guest saved to Supabase successfully
   ```

### Step 6: Verify in Supabase Dashboard
1. Go to https://tecxwucnhtntoatbywcq.supabase.co
2. Navigate to **Table Editor**
3. Check `wedding_events` table - should see your test event
4. Check `guests` table - should see the RSVP submission

## Troubleshooting

### Error: "Could not find column..."
**Cause**: SQL migration not applied or applied incorrectly

**Fix**:
1. Go to Supabase Dashboard → SQL Editor
2. Run this query to check if tables exist:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'guests' 
   ORDER BY ordinal_position;
   ```
3. If columns are missing, re-run the migration from `supabase/migrations/001_initial_schema.sql`

### Error: "Invalid RSVP link"
**Cause**: Event not in Supabase database

**Fix**:
1. Check console logs - it will show where it's looking
2. If event is only in localStorage, you have two options:
   - **Option A**: Migrate existing data: `await migrateLocalStorageToSupabase()`
   - **Option B**: Create a new event (it will save to both Supabase + localStorage)

### Event Found in localStorage but Not Supabase
**Cause**: Event was created before the Supabase integration

**Fix**:
```javascript
// Migrate all localStorage data to Supabase
await migrateLocalStorageToSupabase()
```

### Supabase Connection Error
**Cause**: Invalid Supabase credentials or network issue

**Fix**:
1. Check `.env` file has correct values:
   ```
   VITE_SUPABASE_URL=https://tecxwucnhtntoatbywcq.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_...
   ```
2. Restart dev server: `npm run dev`

## Expected Console Output (Success)

### When Creating Event:
```
✓ Event saved to Supabase successfully
```

### When Opening RSVP Link:
```
Looking up RSVP token: abc123xyz
✓ Found event in Supabase: John & Jane
```

### When Submitting RSVP:
```
Adding guest with 0 documents, total size: 0.00 MB
✓ Guest saved to Supabase successfully
```

## Verification Checklist

- [ ] SQL migration applied in Supabase Dashboard
- [ ] New events save to Supabase (check console for "✓ Event saved to Supabase")
- [ ] RSVP link works in incognito mode
- [ ] Guest submission saves to Supabase (check console for "✓ Guest saved to Supabase")
- [ ] Data visible in Supabase Dashboard tables
- [ ] No console errors

## Quick Diagnosis Commands

```javascript
// Check if migration ran
await verifyMigration()

// Check localStorage data
console.log('Events in localStorage:', JSON.parse(localStorage.getItem('wedding_events') || '[]').length)
console.log('Guests in localStorage:', JSON.parse(localStorage.getItem('wedding_guests') || '[]').length)

// Migrate existing data
await migrateLocalStorageToSupabase()

// Check Supabase connectivity
const { data, error } = await supabase.from('wedding_events').select('count')
console.log('Supabase connection:', error ? 'FAILED' : 'OK', data)
```

## Success Criteria

✅ RSVP link opens in incognito mode without errors  
✅ Form loads with event details  
✅ Guest can submit RSVP  
✅ Data appears in Supabase Dashboard  
✅ Console shows "✓ Guest saved to Supabase successfully"  

---

If you still encounter issues after following these steps, check the browser console for specific error messages and refer to the detailed logs.
