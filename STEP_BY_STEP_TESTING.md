# Step-by-Step Testing - Public RSVP Flow

## Quick Start (15 minutes)

This is the fastest way to verify the fix works.

---

## Part 1: Setup (2 minutes)

### Step 1: Open Two Browsers

**Browser A (Admin):**
- Chrome or Firefox
- Normal mode (not incognito)
- RSVP app: https://your-app-url/

**Browser B (Guest):**
- Different browser OR incognito mode of same browser
- Navigate to same app URL but STAY LOGGED OUT

---

## Part 2: Create Event (3 minutes)

### Step 2: Admin Creates Event (Browser A)

1. In Browser A, login to admin account
2. Go to Dashboard
3. Click "Create Event"
4. Fill form:
   ```
   Groom Name: John Smith
   Bride Name: Jane Doe
   Wedding Date: [30 days from today]
   Venue: Test Venue
   ```
5. Click "Create Event"
6. Wait for success message

**Verify:**
- ✅ Event appears in dashboard
- ✅ Event detail page loads

### Step 3: Get RSVP Link (Browser A)

1. On event detail page, click "Copy RSVP Link"
2. Paste link somewhere safe (notepad, browser tab title bar)
3. Link should look like: `https://your-app-url/#/rsvp/guest/TOKEN-UUID-STRING`

**Verify:**
- ✅ Toast message: "Link Copied!"
- ✅ Link format correct

---

## Part 3: Test Same Browser (5 minutes)

### Step 4: Guest Opens Link (Browser A - same browser)

1. In Browser A, open RSVP link in new tab
2. **Watch for loading spinner:**
   - Should see animated spinner for 1-3 seconds
   - Should see text "Loading event..."
3. **Event should load:**
   - See "John Smith & Jane Doe"
   - See wedding date and venue
   - See "Main Guest Details" form

**Verify:**
- ✅ Loading spinner appears (not blank screen!)
- ✅ Event details load
- ✅ No errors in console

### Step 5: Guest Submits RSVP (Browser A)

1. Fill Step 1:
   ```
   Name: Guest One
   Country Code: +91 (India)
   Mobile: 9876543210
   Email: guest1@example.com
   City: Mumbai
   ID Type: Aadhaar
   ID Number: 123456789012
   ```
2. Click "Next"
3. Step 2: Click "Next" (skip travel/ID)
4. Step 3: Click "Next" (skip additional guests)
5. Step 4: Review, check "Info Accurate" and "Data Consent"
6. Click "Submit"
7. **Wait for success screen:**
   - Should see checkmark icon
   - Should see "Thank You! RSVP Submitted"

**Verify:**
- ✅ No errors during submission
- ✅ Success screen shows
- ✅ Guest details shown on success screen

### Step 6: Check Guest List (Browser A)

1. Go back to Dashboard
2. Click "View Guest List" for the event
3. **Look for guest "Guest One"**

**Verify:**
- ✅ Guest appears in list
- ✅ Shows "Guest One", attendance status, etc.
- ✅ Source shows "RSVP Form"

---

## Part 4: Test Different Browser (5 minutes)

### Step 7: Guest Opens Link (Browser B)

1. In Browser B, paste the RSVP link
2. **Watch for loading spinner:**
   - Should see "Loading event..." spinner
   - Might wait 2-5 seconds (Supabase query)
3. **Event should load:**
   - See "John Smith & Jane Doe"
   - No authentication required!

**Verify:**
- ✅ Loading spinner shows
- ✅ No login page
- ✅ Event loads correctly
- ✅ Check console: "✓ Found event in Supabase" OR "✓ Found event in localStorage"

### Step 8: Guest Submits RSVP (Browser B)

1. Fill Step 1:
   ```
   Name: Guest Two
   Country Code: +91
   Mobile: 9876543211
   Email: guest2@example.com
   City: Bangalore
   ID Type: Passport
   ID Number: AB123456
   ```
2. Next → Next → Next
3. Step 4: Check both boxes, Submit
4. Wait for success

**Verify:**
- ✅ Form submits
- ✅ Success screen shows
- ✅ No "Event not found" errors

### Step 9: Check Guest List (Browser A)

1. In Browser A, refresh guest list
2. **Look for "Guest Two"**

**Verify:**
- ✅ Guest Two appears!
- ✅ Even though submitted in Browser B
- ✅ Cross-browser persistence works

---

## Part 5: Test Error Scenarios (3 minutes)

### Step 10: Test Invalid Link

1. In Browser B, try invalid link:
   ```
   https://your-app-url/#/rsvp/guest/INVALID-TOKEN-12345
   ```
2. **Watch for:**
   - Loading spinner appears (1-2 seconds)
   - Then error screen with:
     - Red error icon
     - "Unable to Load Event"
     - Error message about invalid link
     - "Try Again" button

**Verify:**
- ✅ Loading spinner shows (not blank!)
- ✅ Error message is clear
- ✅ Not a generic "failed" message
- ✅ Try Again button works

### Step 11: Simulate Slow Network

1. In Browser B, open DevTools (F12)
2. Go to Network tab
3. Find dropdown that says "No throttling"
4. Select "Slow 3G"
5. Paste valid RSVP link

**Watch for:**
- Loading spinner for 5-10 seconds
- Event eventually loads
- Form becomes usable

**Verify:**
- ✅ Spinner shows for extended time (good feedback!)
- ✅ Event loads eventually
- ✅ Can submit RSVP

---

## Part 6: Advanced Tests (Optional, 10 minutes)

### Step 12: Test Incognito Mode

1. Browser A: Open NEW INCOGNITO WINDOW
2. In incognito: Paste RSVP link
3. Fill form:
   ```
   Name: Guest Three
   Mobile: 9876543212
   Email: guest3@example.com
   (other fields)
   ```
4. Submit
5. **Close incognito window completely**
6. In Browser A normal mode: Refresh guest list

**Verify:**
- ✅ Event loads in incognito (no login needed)
- ✅ Form submits
- ✅ After closing incognito: Guest Three still visible in normal mode
- ✅ Data didn't vanish (saved to Supabase)

### Step 13: Test Mobile Device

1. On phone: Open RSVP link
2. See loading spinner
3. Event loads
4. Fill form (should be responsive)
5. Submit

**Verify:**
- ✅ Form responsive on mobile
- ✅ No layout issues
- ✅ Submit works

---

## Troubleshooting

### Problem: Loading spinner shows forever

**Solution:**
1. Check internet connection
2. Try "Try Again" button
3. Try different browser
4. Check console (F12) for timeout message

**Expected:** Timeout error after 5 seconds, error screen shows

### Problem: Event not found after loading

**Solution:**
1. Check RSVP link is correct
2. Check event exists in admin dashboard
3. Try incognito mode (forces Supabase check)
4. Check console for error messages

### Problem: Guest doesn't appear in list after submission

**Solution:**
1. Try refreshing guest list (F5)
2. Wait 30 seconds (data sync)
3. Try different browser for guest list
4. Check console for "QuotaExceededError"

### Problem: "QuotaExceededError" during submit

**Solution:**
1. This means localStorage is full
2. Try uploading fewer documents
3. Clear browser cache and try again
4. Use different browser profile

---

## Console Check

Throughout testing, check console (F12 → Console) for:

### Good Signs ✅
```
✓ Found event in Supabase
✓ Guest saved to localStorage
✅ Guest saved to Supabase successfully!
EventIds match: true
Dispatched guestAdded event
```

### Warning Signs ⚠️
```
⚠️ Guest will ONLY be saved to localStorage!
Event not in Supabase, checking localStorage...
```

### Error Signs ❌
```
❌ Supabase save FAILED
RLS policy violation
QuotaExceededError
✗ Event not found anywhere
```

---

## Test Completion Checklist

When all steps pass:

- [ ] **Loading spinner** shows during event load (not blank)
- [ ] **Same browser test** passes (guest submits, appears in list)
- [ ] **Different browser test** passes (guest in Browser B appears when checked in Browser A)
- [ ] **Incognito test** passes (guest submits in incognito, persists after close)
- [ ] **Error test** passes (invalid link shows error screen with retry button)
- [ ] **Slow network test** passes (spinner shows, doesn't time out)
- [ ] **Mobile test** passes (form responsive and works)
- [ ] **Console clean** (no errors or critical warnings)
- [ ] **No blank screens** (always shows loading or error state)

---

## Quick Reference

### Test URLs

**Same browser test:**
1. Create event in admin
2. Copy RSVP link from event detail
3. Open in new tab (same browser, same session)

**Different browser test:**
1. Copy same RSVP link
2. Open in completely different browser
3. OR open in incognito of same browser

**Invalid link test:**
```
https://your-app-url/#/rsvp/guest/INVALID-TOKEN-12345
```

### Expected Timings

| Action | Time | Feedback |
|--------|------|----------|
| Event load (fast network) | 1-2 sec | Spinner |
| Event load (slow network) | 3-5 sec | Spinner then loads |
| Event load (timeout) | 5+ sec | Timeout error |
| Form submission | 2-3 sec | Possible progress bar |
| Guest list refresh | < 1 sec | Instant |

---

## Success Criteria

The fix is working when:

✅ **Loading states show** - Never see blank screens during loading  
✅ **Error screens show** - Clear messages for problems  
✅ **Cross-browser works** - Guest submits in Browser B, appears when checked in Browser A  
✅ **Incognito works** - Guest submits in incognito, data persists after close  
✅ **Timeout works** - 5-second timeout on slow networks (not infinite wait)  
✅ **No console errors** - DevTools console is clean  
✅ **Mobile responsive** - Form works on phone/tablet  
✅ **Error recovery** - "Try Again" button works  

---

## When to Stop Testing

You can stop when:

1. **All steps 1-11 pass** (basic tests)
2. **Guest from Browser B appears in Browser A** (cross-browser sync verified)
3. **Incognito test passes** (data persistence verified)
4. **Error tests show proper screens** (not blank)
5. **Console is clean** (no critical errors)

---

## Report Results

**Document your testing:**

```
Test Date: [DATE]
Tester: [YOUR NAME]
Browser A: [Chrome/Firefox version]
Browser B: [Different browser]
OS: [Windows/Mac/Linux]

Results:
- Same browser: PASS ✅
- Different browser: PASS ✅
- Incognito: PASS ✅
- Error handling: PASS ✅
- Mobile (optional): PASS ✅

Issues found:
[None / List issues here]

Overall: ✅ READY FOR PRODUCTION
```

---

## What's Next?

After successful testing:

1. **Deploy to production** (if all tests pass)
2. **Monitor for issues** (check console errors, user reports)
3. **Gather feedback** (improvements, issues)
4. **Fix any issues** (rollback if critical problems)

---

## Questions During Testing?

**Blank screen during load?**
- Expected behavior BEFORE fix
- Should now show loading spinner
- If you see blank: Fix not applied correctly

**Guest doesn't appear after submission?**
- Wait 30 seconds
- Refresh guest list
- Check different browser (if using same device)

**Getting "Event not found"?**
- Check link is correct
- Try different browser
- Check event exists in dashboard

---

## Estimated Testing Time

- **Quick Test (all main steps):** 15 minutes
- **With incognito test:** 20 minutes
- **With mobile test:** 30 minutes
- **Full comprehensive test:** 2 hours (see RSVP_TESTING_PLAN.md)

---

**Ready? Start with Part 1 above!** 🚀
