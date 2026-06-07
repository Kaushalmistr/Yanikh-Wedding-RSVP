# 🚨 FIX NOW - Complete Solution

## What You're Seeing
```
Error: Could not find the 'additional_guests' column of 'guests'
```

## Why It's Happening
The database table was created **WITHOUT** the required columns. The migration wasn't applied correctly.

---

# 🔧 FIX IT NOW (3 Minutes)

## Step 1: Run This SQL in Supabase

1. **Open**: https://tecxwucnhtntoatbywcq.supabase.co
2. **Click**: SQL Editor → New Query
3. **Open this file**: `supabase/migrations/002_complete_reset.sql`
4. **Copy ALL content** (entire file)
5. **Paste** into Supabase SQL Editor
6. **Click**: Run (or Ctrl/Cmd + Enter)
7. **Wait** for: "Success. No rows returned"

✅ Tables are now created with ALL columns!

---

## Step 2: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## Step 3: Verify Fix

Open browser console (F12) and run:

```javascript
await verifyMigration()
```

**You should see:**
```
users: ✓ OK
wedding_events: ✓ OK
guests: ✓ OK
bulk_messages: ✓ OK
uploaded_guest_lists: ✓ OK
✅ All database tables exist!
✅ All required columns exist!
```

---

## Step 4: Test It Works

### Create Event
1. Log into app
2. Create new event
3. Console shows: `✓ Event saved to Supabase successfully`

### Test RSVP Link
1. Copy RSVP link
2. Open **incognito window**
3. Paste link
4. Console shows: `✓ Found event in Supabase`
5. Submit RSVP
6. Console shows: `✓ Guest saved to Supabase successfully`

✅ **DONE! No more errors!**

---

# 🔍 Troubleshooting

## Still seeing column errors?

```javascript
// Check what columns exist
await checkGuestsTableSchema()
```

This shows exactly what's in the database.

## Can't connect to Supabase?

Check `.env` file has:
```
VITE_SUPABASE_URL=https://tecxwucnhtntoatbywcq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## Migration failed?

Make sure you:
- ✅ Copied **entire** SQL file content
- ✅ Pasted in **Supabase Dashboard** (not VS Code)
- ✅ Clicked **Run** button
- ✅ Waited for completion

---

# ⚠️ Important Notes

## Data Loss Warning
Running `002_complete_reset.sql` will **DELETE all data** in:
- Users
- Events  
- Guests
- Messages

If you have important data, use **Alternative Fix** in [URGENT_FIX.md](URGENT_FIX.md)

## After Reset
You'll need to:
- Create new events (old ones are gone)
- Re-send RSVP links
- Guests submit RSVPs again

---

# 📁 Files You Need

1. **Run This**: `supabase/migrations/002_complete_reset.sql`
2. **Read This**: [URGENT_FIX.md](URGENT_FIX.md) - Full details
3. **Console Helper**: `await checkGuestsTableSchema()`

---

# ✅ Quick Checklist

- [ ] Open Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Copy/paste 002_complete_reset.sql
- [ ] Run the query
- [ ] Restart dev server
- [ ] Run `await verifyMigration()`
- [ ] See all ✓ OK
- [ ] Create test event
- [ ] Test RSVP in incognito
- [ ] No more errors! 🎉

---

**The fix takes 3 minutes. Run the SQL migration now!** 🚀
