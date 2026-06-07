# 🔍 Diagnose: Data Not Saving to Supabase

You're right - data is being saved to localStorage but NOT Supabase. This is why incognito mode fails.

## 🚀 Quick Diagnosis (1 Minute)

### Step 1: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Open App & Check Console

1. Open http://localhost:5173 in your browser
2. Open browser console (F12)
3. Look for this message:
   ```
   🔧 Supabase Config:
     url: ✓ Set  OR  ✗ Missing
     key: ✓ Set  OR  ✗ Missing
   ```

**If you see "✗ Missing"** - Your `.env` file is not configured correctly!

### Step 3: Run Diagnostic

In browser console (F12), run:

```javascript
await diagnoseEventStorage()
```

This shows:
- How many events are in localStorage
- How many events are in Supabase
- Why they don't match

## 🔧 Most Likely Causes

### Cause 1: Missing .env File (Most Common!)

**Check**: Open `.env` file in your project root

**Should contain:**
```env
VITE_SUPABASE_URL=https://tecxwucnhtntoatbywcq.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_2rrxNmvgHUuKxXmJuc0Ysg_kAShnG5h
```

**If .env is empty or missing:**
1. Copy the contents above
2. Paste into `.env` file
3. **Restart dev server** (IMPORTANT!)
4. Check console - should now show "✓ Set"

### Cause 2: Dev Server Not Restarted

Vite only loads `.env` variables on startup.

**Fix:**
1. Stop server: Ctrl+C
2. Restart: `npm run dev`
3. Refresh browser

### Cause 3: Wrong Environment Variable Names

Must be `VITE_SUPABASE_URL` not `SUPABASE_URL` (needs `VITE_` prefix for Vite)

## 🧪 Test After Fix

### Create New Event & Watch Console

1. Log into app
2. Click **Create New Event**
3. Fill in details
4. Submit

**Watch console - should see:**
```
📝 Creating event: John & Jane
   RSVP Token: abc123xyz
☁️ Attempting to save to Supabase...
✅ Event saved to Supabase successfully!
   Database record: {...}
✓ Event saved to localStorage
```

**If you see "❌ Supabase save FAILED":**
- The error message will tell you exactly what's wrong
- Most common: "Failed to fetch" = wrong URL in .env
- Or: "Invalid API key" = wrong key in .env

### Verify Event in Supabase

Run in console:
```javascript
await diagnoseEventStorage()
```

**Should show:**
```
📱 Events in localStorage: 1
☁️ Events in Supabase: 1
```

### Test RSVP in Incognito

1. Copy RSVP link from event
2. Open **incognito window**
3. Paste link

**Should see in console:**
```
Looking up RSVP token: abc123xyz
✓ Found event in Supabase: John & Jane
```

✅ **RSVP form loads! It works!**

## 📊 Complete Diagnostic Commands

```javascript
// 1. Check Supabase configuration
// (Automatically logged when page loads)

// 2. Compare localStorage vs Supabase
await diagnoseEventStorage()

// 3. Look up specific RSVP token
await lookupRSVPToken('paste-your-token-here')

// 4. Verify database tables
await verifyMigration()

// 5. Test guest table schema
await checkGuestsTableSchema()

// 6. Check Supabase connection directly
const { data, error } = await supabase.from('wedding_events').select('count')
console.log('Connection:', error ? '❌ FAILED' : '✅ OK', error || data)
```

## 🎯 Expected Results After Fix

**Console output when creating event:**
```
📝 Creating event: John & Jane
☁️ Attempting to save to Supabase...
✅ Event saved to Supabase successfully!
```

**Console output in incognito:**
```
🔧 Supabase Config:
  url: ✓ Set
  key: ✓ Set
Looking up RSVP token: abc123xyz
✓ Found event in Supabase: John & Jane
```

**Diagnostic shows:**
```
📱 Events in localStorage: 1
☁️ Events in Supabase: 1
```

## 🔄 If Old Events Need Migration

If you already have events in localStorage (before fix):

```javascript
// Migrate old events to Supabase
await migrateLocalStorageToSupabase()
```

Or just **create new events** after fixing .env - they'll save to both!

## ⚡ Quick Fix Checklist

- [ ] Check `.env` file exists in project root
- [ ] `.env` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Restart dev server (Ctrl+C, then `npm run dev`)
- [ ] Refresh browser
- [ ] Console shows "🔧 Supabase Config: url: ✓ Set"
- [ ] Create new event
- [ ] Console shows "✅ Event saved to Supabase successfully!"
- [ ] Run `await diagnoseEventStorage()`
- [ ] See events in both localStorage AND Supabase
- [ ] Test RSVP link in incognito - works!

---

**The most common issue is missing or incorrect .env file. Check that first!** 🚀
