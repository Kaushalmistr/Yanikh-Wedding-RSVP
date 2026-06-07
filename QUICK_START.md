# RSVP Cross-Session Fix - Quick Start

## ✅ What Was Fixed
The RSVP link now works across different browsers, devices, and incognito sessions.

**Recent fixes:**
- ✅ Fixed column name mapping (camelCase → snake_case)
- ✅ Added proper null/undefined handling
- ✅ Improved error logging for debugging
- ✅ Changed `.single()` to `.maybeSingle()` to prevent false errors

## 🚀 Quick Setup (3 Steps)

### Step 1: Apply Database Migration
Open your Supabase Dashboard and run the SQL migration:

1. Go to: https://tecxwucnhtntoatbywcq.supabase.co
2. Click **SQL Editor** → **New Query**
3. Copy & paste the contents from: `supabase/migrations/001_initial_schema.sql`
4. Click **Run**
5. ✅ You should see "Success. No rows returned"

### Step 2: Restart Development Server
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Verify Migration
Open browser console (F12) and run:
```javascript
await verifyMigration()
```

Expected output:
```
users: ✓ OK
wedding_events: ✓ OK
guests: ✓ OK
bulk_messages: ✓ OK
uploaded_guest_lists: ✓ OK
✅ All database tables exist!
```

## 🔄 Migrate Existing Data (If You Have Events in localStorage)

**⚠️ Important**: The migration code has been fixed to handle null values properly.

If you previously tried to migrate and got errors, you can now retry:

```javascript
// Run in browser console (F12)
await migrateLocalStorageToSupabase()
```

Expected output:
```
Found X events in localStorage
✓ Migrated event: [Groom] & [Bride]
Found X guests in localStorage
✓ Migrated guest: [Name]
✅ Migration complete!
Events: X/X migrated
Guests: X/X migrated
```

If you see errors, check [TESTING_GUIDE.md](TESTING_GUIDE.md) for troubleshooting.

## 🧪 Test the Fix (After Migration)

### Create New Event & Test
1. **Create a new event** in your app (logged in)
2. **Copy the RSVP link** from event details
3. **Open incognito window**
4. **Paste the RSVP link**
5. ✅ RSVP form should load!

### Watch Console Logs
Open browser console (F12) to see detailed logging:

**When opening RSVP link:**
```
Looking up RSVP token: abc123xyz
✓ Found event in Supabase: John & Jane
```

**When submitting RSVP:**
```
✓ Guest saved to Supabase successfully
```

## 📊 Verify Data in Supabase

1. Go to Supabase Dashboard: https://tecxwucnhtntoatbywcq.supabase.co
2. Navigate to **Table Editor**
3. Check these tables:
   - `wedding_events` - Should see your events with `rsvp_token` column
   - `guests` - Should see RSVP submissions

## ✅ Testing Checklist

- [ ] SQL migration applied successfully
- [ ] Development server restarted
- [ ] `verifyMigration()` shows all tables OK
- [ ] Create new event (check console: "✓ Event saved to Supabase")
- [ ] RSVP link works in **incognito mode**
- [ ] Guest can submit RSVP
- [ ] Check console: "✓ Guest saved to Supabase successfully"
- [ ] Data appears in Supabase Dashboard

## 🐛 Common Issues & Quick Fixes

**Issue**: "Could not find the 'additional_guests' column"  
**Fix**: SQL migration not applied correctly. Re-run the migration SQL in Supabase Dashboard.

**Issue**: "Invalid RSVP link" in incognito mode  
**Fix**: Event not in Supabase. Either:
- Create a **new event** (it will auto-save to Supabase), OR
- Migrate existing data: `await migrateLocalStorageToSupabase()`

**Issue**: Migration errors with null values  
**Fix**: This is now fixed! Restart dev server and retry migration.

**Issue**: No console output when testing  
**Fix**: Make sure dev server is restarted with the latest code changes.

For detailed troubleshooting, see: [TESTING_GUIDE.md](TESTING_GUIDE.md)

## 🔍 Console Commands (Debugging)

These commands are available in browser console (F12):

```javascript
// Verify database tables exist
await verifyMigration()

// Migrate localStorage data to Supabase
await migrateLocalStorageToSupabase()

// Check localStorage contents
console.log('Events:', JSON.parse(localStorage.getItem('wedding_events') || '[]').length)
console.log('Guests:', JSON.parse(localStorage.getItem('wedding_guests') || '[]').length)

// Test Supabase connection
const { data, error } = await supabase.from('wedding_events').select('count')
console.log('Supabase:', error ? 'FAILED' : 'OK', data)

// Check if specific event exists by token
const token = 'your-rsvp-token-here'
const event = await getEventByRSVPToken(token)
console.log('Event found:', event)
```

## 📝 What Changed (Technical Details)

**Files Modified:**
- `src/lib/db.ts` - Fixed null handling in `addGuest()`, improved `getEventByRSVPToken()`
- `src/lib/migration.ts` - Fixed null handling in migration helper
- `src/pages/RSVPForm.tsx` - Made event loading async
- `src/pages/CreateEvent.tsx` - Made event creation async

**Key Improvements:**
- All optional fields now have fallback values (|| null, || [], || false)
- Changed `.single()` to `.maybeSingle()` to avoid false errors
- Added extensive console logging for debugging
- Proper camelCase to snake_case conversion

**Backward Compatibility:**
- Data still saves to localStorage as fallback
- Queries try Supabase first, then localStorage
- Existing localStorage data continues to work

## 🎯 Next Steps

1. ✅ Apply SQL migration (if not done)
2. ✅ Restart dev server
3. ✅ Verify migration: `await verifyMigration()`
4. ✅ Create test event
5. ✅ Test RSVP link in incognito
6. ✅ (Optional) Migrate existing data: `await migrateLocalStorageToSupabase()`

---

**Need More Help?**
- Detailed testing steps: [TESTING_GUIDE.md](TESTING_GUIDE.md)
- Full implementation guide: [RSVP_FIX_GUIDE.md](RSVP_FIX_GUIDE.md)

