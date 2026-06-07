# 🔥 URGENT FIX - Column Not Found Error

## The Problem
```
Could not find the 'additional_guests' column of 'guests' in the schema cache
```

**Root Cause**: The database tables were created WITHOUT all the required columns. The migration SQL either:
- Wasn't run at all
- Was partially applied
- Tables were created manually before migration

## ✅ IMMEDIATE FIX (2 Steps)

### Step 1: Run Complete Reset Migration

1. **Open Supabase Dashboard**: https://tecxwucnhtntoatbywcq.supabase.co
2. **Go to**: SQL Editor → New Query
3. **Copy ENTIRE contents** from: `supabase/migrations/002_complete_reset.sql`
4. **Paste and Run** (click Run button)
5. **Wait** for "Success. No rows returned"

⚠️ **WARNING**: This will DELETE all existing data in the database!  
If you have important data, see "Alternative Fix" below.

### Step 2: Verify Schema is Correct

Restart your dev server:
```bash
# Press Ctrl+C to stop
npm run dev
```

Then in browser console (F12):
```javascript
// Check if all tables and columns exist
await verifyMigration()
```

**Expected output:**
```
users: ✓ OK
wedding_events: ✓ OK
guests: ✓ OK
bulk_messages: ✓ OK
uploaded_guest_lists: ✓ OK
✅ All database tables exist!
✅ All required columns exist!
```

## 🧪 Test the Fix

### Create New Event
1. Log into your app
2. Create a new wedding event
3. Watch console - should see: `✓ Event saved to Supabase successfully`

### Test RSVP in Incognito
1. Copy RSVP link
2. Open incognito window
3. Paste link
4. Should see: `✓ Found event in Supabase: [Names]`
5. Fill and submit form
6. Should see: `✓ Guest saved to Supabase successfully`

✅ **No more "column not found" errors!**

## 🔍 Alternative: Check What's Wrong First

If you want to see what's missing before resetting:

```javascript
// In browser console (F12)
await checkGuestsTableSchema()
```

This will show you exactly which columns are missing.

## 📊 Alternative Fix (If You Have Important Data)

If you already have data you don't want to lose:

### Option 1: Manual Column Addition
Instead of dropping tables, you can add missing columns. In Supabase SQL Editor:

```sql
-- Add missing columns to guests table
ALTER TABLE guests 
  ADD COLUMN IF NOT EXISTS additional_guests JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS function_attendance JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS special_assistance JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS celebration_participation JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS country_code TEXT,
  ADD COLUMN IF NOT EXISTS needs_accommodation BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS check_in_date TEXT,
  ADD COLUMN IF NOT EXISTS check_out_date TEXT,
  ADD COLUMN IF NOT EXISTS number_of_rooms INTEGER,
  ADD COLUMN IF NOT EXISTS room_preference TEXT,
  ADD COLUMN IF NOT EXISTS preferred_roommates TEXT,
  ADD COLUMN IF NOT EXISTS arrival_mode TEXT,
  ADD COLUMN IF NOT EXISTS arrival_date TEXT,
  ADD COLUMN IF NOT EXISTS arrival_time TEXT,
  ADD COLUMN IF NOT EXISTS arrival_transport_name TEXT,
  ADD COLUMN IF NOT EXISTS arrival_number TEXT,
  ADD COLUMN IF NOT EXISTS arrival_location TEXT,
  ADD COLUMN IF NOT EXISTS arrival_itinerary_file TEXT,
  ADD COLUMN IF NOT EXISTS departure_date TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TEXT,
  ADD COLUMN IF NOT EXISTS departure_transport_name TEXT,
  ADD COLUMN IF NOT EXISTS departure_number TEXT,
  ADD COLUMN IF NOT EXISTS departure_itinerary_file TEXT,
  ADD COLUMN IF NOT EXISTS needs_pickup BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS needs_drop BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transfer_passengers INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_bags INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transfer_requirements TEXT,
  ADD COLUMN IF NOT EXISTS id_type TEXT,
  ADD COLUMN IF NOT EXISTS id_number TEXT,
  ADD COLUMN IF NOT EXISTS id_front_file TEXT,
  ADD COLUMN IF NOT EXISTS id_back_file TEXT,
  ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT,
  ADD COLUMN IF NOT EXISTS info_accurate BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS data_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS upload_source TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_status TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'guests' 
ORDER BY ordinal_position;
```

### Option 2: Export → Reset → Import

1. **Export data** from Supabase Dashboard (Table Editor → Export)
2. **Run complete reset** (002_complete_reset.sql)
3. **Import data** back via Table Editor

## ⚡ Quick Diagnosis Commands

```javascript
// Check if tables exist
await verifyMigration()

// Check guests table schema
await checkGuestsTableSchema()

// Check Supabase connection
const { data, error } = await supabase.from('wedding_events').select('count')
console.log('Connection:', error ? 'FAILED' : 'OK')
```

## 🎯 Success Checklist

After running the fix:
- [ ] `await verifyMigration()` shows all ✓ OK
- [ ] `await checkGuestsTableSchema()` shows all required columns
- [ ] Can create new event without errors
- [ ] RSVP link works in incognito
- [ ] Can submit RSVP without column errors
- [ ] Console shows "✓ Guest saved to Supabase successfully"

## 💡 Why This Happened

The first migration file (`001_initial_schema.sql`) uses `CREATE TABLE IF NOT EXISTS`.

**If tables already existed** (maybe created manually or from a previous attempt), the migration would skip creating them, leaving you with incomplete schema.

The complete reset migration (`002_complete_reset.sql`) uses `DROP TABLE IF EXISTS` first, ensuring clean slate.

## 🆘 Still Having Issues?

Run these diagnostics:

```javascript
// 1. Check connection
const { data: testConn } = await supabase.from('wedding_events').select('count')
console.log('Connected:', !!testConn)

// 2. Check schema
await checkGuestsTableSchema()

// 3. Try simple insert
const { error } = await supabase.from('guests').insert({
  id: crypto.randomUUID(),
  event_id: crypto.randomUUID(),
  name: 'Test Guest',
  mobile: '1234567890',
  email: 'test@test.com',
  city: 'Test City',
  responding_for: 'Self',
  attendance_status: 'Yes'
})
console.log('Insert test:', error ? 'FAILED' : 'OK', error)
```

**Post the error output** if you still see issues!

---

## 📝 Files to Use

1. **Diagnosis**: `supabase/migrations/000_check_schema.sql`
2. **Complete Fix**: `supabase/migrations/002_complete_reset.sql`
3. **Console Helper**: `await checkGuestsTableSchema()`

**Run the complete reset migration now to fix the issue!** 🚀
