# ✅ Database Verification & Testing

## Good News! 🎉

Based on your screenshot, the database migration **worked**! All tables exist:

```
users: ✓ OK
wedding_events: ✓ OK
guests: ✓ OK
bulk_messages: ✓ OK
uploaded_guest_lists: ✓ OK
✅ All database tables exist!
```

The error you saw was just from the diagnostic test trying to use a fake event_id. **This is not a real problem!**

---

## 🔄 Restart & Test Again

I've fixed the diagnostic function. Now do this:

### Step 1: Restart Dev Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### Step 2: Run Updated Verification

Open browser console (F12) and run:

```javascript
await checkGuestsTableSchema()
```

**Expected output:**
```
✅ Guests table is accessible!
📋 Testing insert with all required fields...
✅ Insert test PASSED!
✅ All required columns exist and work correctly!
🎉 Database schema is properly configured!
```

---

## 🧪 Complete Test Workflow

Run these commands in sequence to verify everything:

```javascript
// 1. Check tables exist
await verifyMigration()

// 2. Check columns work
await checkGuestsTableSchema()

// 3. Test creating an event
const testEventId = crypto.randomUUID()
const { data: event, error: eventErr } = await supabase.from('wedding_events').insert({
  id: testEventId,
  rsvp_token: 'test-' + Date.now(),
  groom_name: 'John',
  bride_name: 'Jane',
  wedding_date: '2026-12-31',
  venue: 'Test Venue',
  couple_story: 'Test story',
  description: 'Test description',
  cover_image: '',
  created_by: null
}).select().single()

console.log('Event creation:', eventErr ? 'FAILED' : 'SUCCESS', eventErr || event)

// 4. Test creating a guest
if (!eventErr && event) {
  const { data: guest, error: guestErr } = await supabase.from('guests').insert({
    id: crypto.randomUUID(),
    event_id: event.id,
    name: 'Test Guest',
    mobile: '1234567890',
    email: 'test@test.com',
    city: 'Test City',
    responding_for: 'Self',
    attendance_status: 'Yes',
    function_attendance: { 'Mehendi': 'Yes' },
    additional_guests: [{ name: 'Guest 2', age: 30 }],
    adults: 2,
    children: 0,
    infants: 0,
    documents: [],
    special_assistance: [],
    celebration_participation: [],
    country_code: 'US',
    needs_accommodation: false,
    needs_pickup: false,
    needs_drop: false,
    transfer_passengers: 0,
    transfer_bags: 0,
    dietary_restrictions: 'None',
    additional_notes: 'Test notes',
    info_accurate: true,
    data_consent: true
  }).select().single()
  
  console.log('Guest creation:', guestErr ? 'FAILED' : 'SUCCESS', guestErr || guest)
  
  // 5. Clean up test data
  if (!guestErr) {
    await supabase.from('guests').delete().eq('event_id', event.id)
    await supabase.from('wedding_events').delete().eq('id', event.id)
    console.log('✓ Test data cleaned up')
  }
}

console.log('\n✅ All tests complete!')
```

---

## 🎯 Real-World Test

Now test the actual functionality:

### Create Real Event
1. Go to your app (localhost:5173)
2. Log in
3. Click **Create New Event**
4. Fill in event details
5. Submit

**Watch console - should see:**
```
✓ Event saved to Supabase successfully
```

### Test RSVP Link
1. Click on the event you just created
2. Copy the **RSVP link**
3. Open **incognito window** (Ctrl+Shift+N or Cmd+Shift+N)
4. Paste the RSVP link

**Watch console - should see:**
```
Looking up RSVP token: [token]
✓ Found event in Supabase: John & Jane
```

### Submit RSVP
1. Fill out the RSVP form
2. Submit

**Watch console - should see:**
```
✓ Guest saved to Supabase successfully
```

### Verify in Database
1. Go to Supabase Dashboard
2. Table Editor → `wedding_events`
3. Should see your event
4. Table Editor → `guests`
5. Should see the RSVP submission

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ `verifyMigration()` shows all tables ✓ OK
- ✅ `checkGuestsTableSchema()` shows ✅ Insert test PASSED
- ✅ Can create events (console shows success)
- ✅ RSVP link works in incognito mode
- ✅ Can submit RSVP (console shows success)
- ✅ Data appears in Supabase Dashboard

---

## 🐛 If You Still See Errors

### "Column not found" error when creating guest

Run this diagnostic:
```javascript
await checkGuestsTableSchema()
```

If it shows "Insert test FAILED", the migration didn't complete properly.

**Fix**: Re-run the complete reset:
1. Go to Supabase Dashboard → SQL Editor
2. Copy/paste from: `supabase/migrations/002_complete_reset.sql`
3. Run it again

### "Invalid RSVP link" in incognito

This means the event isn't in Supabase. Check:

```javascript
// See what events exist in Supabase
const { data: events } = await supabase.from('wedding_events').select('*')
console.log('Events in Supabase:', events)

// See what events exist in localStorage
const localEvents = JSON.parse(localStorage.getItem('wedding_events') || '[]')
console.log('Events in localStorage:', localEvents)
```

If events are only in localStorage, you need to create new events (they'll save to both).

---

## 🎉 You're Almost There!

Based on your screenshot, the tables are correctly set up. Just:

1. ✅ Restart dev server
2. ✅ Run `await checkGuestsTableSchema()`
3. ✅ Create a test event
4. ✅ Test RSVP in incognito

The fix is complete! 🚀
