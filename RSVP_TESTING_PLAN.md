# Public RSVP Flow - Complete Testing Plan

## Overview

This testing plan verifies that public RSVP links work correctly across browsers, devices, sessions, and network conditions.

---

## Test Environment Setup

### Prerequisites

1. **Two browsers installed:**
   - Chrome or Brave (for Browser A - admin)
   - Firefox or Edge (for Browser B - guest)

2. **Network tools:**
   - DevTools Network throttling (Chrome)
   - Browser incognito/private mode

3. **Accounts:**
   - One admin account for event creation

---

## Test Suite 1: Basic Cross-Browser Functionality

### Test 1.1: Event Creation and Link Generation

**Setup:**
- Browser A: Chrome (normal mode)
- Admin logged in

**Steps:**
1. Go to Dashboard → Create Event
2. Fill form:
   - Groom: "John Smith"
   - Bride: "Jane Doe"
   - Date: 30 days from today
   - Venue: "Test Hotel"
3. Click "Create Event"
4. On event detail page, click "Copy RSVP Link"

**Expected:**
- ✅ Event created successfully
- ✅ RSVP link copied (toast shows "Link Copied!")
- ✅ Link format: `https://app.com/#/rsvp/guest/TOKEN-UUID`

**Verify:**
- Open DevTools → Console
- Look for: "📝 Creating event:" and "RSVP Token: [token]"

---

### Test 1.2: Same Browser - Basic RSVP

**Setup:**
- Same as 1.1
- Admin still logged in

**Steps:**
1. Guest opens RSVP link in new tab (same browser, same session)
2. **Verify:** Event loads (see groom/bride names, date, venue)
3. Fill step 1:
   - Name: "Guest One"
   - Mobile: "9876543210" (or with country code)
   - Email: "guest1@example.com"
   - City: "Mumbai"
   - ID Type: "Aadhaar"
   - ID Number: "123456789012"
4. Next step
5. Fill step 2-4 with basic info (no documents)
6. Review and submit
7. **Verify:** Success page shows

**Expected:**
- ✅ Form loads completely
- ✅ All steps fill without errors
- ✅ Success page displays
- ✅ "Thank You! RSVP Submitted" message shown

**Verify in Console:**
- "✓ Found event in Supabase" OR "✓ Found event in localStorage"
- "eventIds match: true"
- "✅ Guest saved to localStorage"

**Verify in Guest List:**
1. Go back to dashboard
2. Click guest list for event
3. **Verify:** Guest "Guest One" appears in list

---

### Test 1.3: Different Browser - RSVP

**Setup:**
- Browser A: Chrome with event from Test 1.1
- Browser B: Firefox (not logged in)

**Steps:**
1. In Browser A: Copy RSVP link again
2. In Browser B: Open RSVP link
3. **Verify:** Page shows loading indicator for 1-2 seconds
4. **Verify:** Event loads correctly (John Smith & Jane Doe)
5. Fill form:
   - Name: "Guest Two"
   - Mobile: "9876543211"
   - Email: "guest2@example.com"
   - City: "Bangalore"
   - ID Type: "Passport"
   - ID Number: "AB123456"
6. Submit RSVP

**Expected:**
- ✅ Loading spinner appears (not blank screen!)
- ✅ Event loads without authentication needed
- ✅ Form opens and fills successfully
- ✅ No "Event not found" errors
- ✅ Submission succeeds

**Verify:**
- Browser B console should show timeout or successful load
- Browser A: Go to guest list, should see "Guest Two" ✅

---

### Test 1.4: Incognito/Private Mode

**Setup:**
- Browser A: Normal mode with event
- Browser B: Incognito/Private window

**Steps:**
1. In Browser B incognito: Open RSVP link
2. **Verify:** Event loads (should use Supabase, not localStorage)
3. Fill form:
   - Name: "Guest Three"
   - Mobile: "9876543212"
   - Email: "guest3@example.com"
   - City: "Delhi"
   - Basic form only (no documents)
4. Submit RSVP
5. **Verify:** Success shown
6. Close incognito window completely
7. In Browser A normal mode: Check guest list

**Expected:**
- ✅ Event loads in incognito (uses Supabase)
- ✅ Form opens and fills
- ✅ Submission succeeds
- ✅ After closing incognito: Guest still visible in normal mode ✓
  - (Data was saved to Supabase/localStorage, not lost)

**Verify:**
- incognito localStorage doesn't have events initially
- But Supabase is queried
- Guest appears in admin's browser (Browser A)

---

## Test Suite 2: Error Handling

### Test 2.1: Invalid RSVP Link

**Setup:**
- Browser A: Navigate to `/rsvp/guest/INVALID-TOKEN-12345`

**Steps:**
1. Load URL
2. **Verify:** Loading spinner shows for 1-2 seconds
3. **Verify:** Error screen appears

**Expected:**
- ✅ Loading state shows (not blank!)
- ✅ Clear error message: "Invalid RSVP link. The event may have been deleted..."
- ✅ "Try Again" button shown
- ✅ No form rendered

**Verify Console:**
- "✗ Event not found in localStorage either"

---

### Test 2.2: Network Timeout Simulation

**Setup:**
- Chrome with DevTools open
- Network throttling: Offline

**Steps:**
1. Open RSVP link while offline
2. Wait 5-6 seconds
3. **Verify:** Loading spinner eventually gives way to error
4. Connect back online
5. Click "Try Again"

**Expected:**
- ✅ Timeout occurs after 5 seconds
- ✅ Error message shown
- ✅ Fallback to localStorage happens
- ✅ If event was created before offline, it might load ✓
- ✅ After reconnecting, "Try Again" loads event from Supabase

---

### Test 2.3: Slow Network

**Setup:**
- Chrome DevTools: Network throttling to "Slow 3G"
- RSVP link ready

**Steps:**
1. Open RSVP link on slow network
2. **Verify:** Loading spinner shows while query completes (5-10 seconds)
3. **Verify:** Event eventually loads or timeout error shown
4. Form loads even if slow

**Expected:**
- ✅ Spinner shows for 5-10 seconds (no blank screen!)
- ✅ Event loads or timeout error
- ✅ Form usable after load

---

## Test Suite 3: Document Upload

### Test 3.1: Single Document Upload

**Setup:**
- Browser B (different from admin): Open RSVP link
- Have a test image file (< 5MB)

**Steps:**
1. Fill steps 1-2
2. Step 2 - ID section:
   - Upload ID front (image file)
3. Submit form

**Expected:**
- ✅ File uploads successfully
- ✅ No quota errors
- ✅ Success page shows
- ✅ Data saved

---

### Test 3.2: Multiple Document Uploads

**Setup:**
- Multiple test files (1-2 MB each)

**Steps:**
1. Fill steps 1-2
2. Upload multiple documents:
   - ID front image
   - ID back image
   - General documents
3. Submit

**Expected:**
- ✅ All files upload
- ✅ Progress indicator shows (0%-100%)
- ✅ Success on submit
- ✅ No quota errors

---

### Test 3.3: Large File Handling

**Setup:**
- Test file that's exactly at 5MB limit

**Steps:**
1. Try uploading file
2. **Verify:** Validation occurs

**Expected:**
- ✅ Files up to 5 MB upload successfully
- ✅ Files over 5 MB show error: "File is too large (X MB). Maximum is 5 MB."
- ✅ User cannot add oversized file

---

### Test 3.4: Storage Quota Exceeded

**Setup:**
- Multiple large documents that exceed 10MB total

**Steps:**
1. Try uploading many large files
2. **Verify:** Error on 3rd or 4th file

**Expected:**
- ✅ Clear error: "Not enough storage space. File needs X MB but only Y MB available."
- ✅ User told to remove files
- ✅ Can retry after removing

---

## Test Suite 4: Data Persistence

### Test 4.1: Data Persists Across Browser Restarts

**Setup:**
- Browser A: Submit RSVP
- Close Browser A completely
- Reopen Browser A

**Steps:**
1. Close browser
2. Reopen browser
3. Navigate to guest list

**Expected:**
- ✅ Guest still visible in list
- ✅ Data persisted to Supabase/localStorage

---

### Test 4.2: Data Accessible from Different Device

**Setup:**
- Device A (Phone): Submit RSVP
- Device B (Laptop): Check guest list

**Steps:**
1. On phone: Submit RSVP
2. On laptop: Admin logs in, checks guest list

**Expected:**
- ✅ Guest visible on laptop even though submitted on phone
- ✅ Supabase successfully synced data
- ✅ Cross-device persistence works

---

### Test 4.3: Incognito Data Retention

**Setup:**
- Incognito window: Submit RSVP with documents
- Normal window: Check guest list

**Steps:**
1. In incognito: Submit RSVP
2. In normal window: Check guest list

**Expected:**
- ✅ Guest appears in normal window's guest list
- ✅ Data survived incognito→normal window transition

---

## Test Suite 5: Form Validation

### Test 5.1: Required Fields

**Setup:**
- RSVP link open

**Steps:**
1. Try to proceed step 1 without filling required fields:
   - Name: empty
   - Mobile: empty
   - Email: empty
2. Click "Next"

**Expected:**
- ✅ Error message: "Please fill all required fields"
- ✅ Cannot proceed to step 2

---

### Test 5.2: Email Validation

**Setup:**
- Step 1 form open

**Steps:**
1. Fill name, mobile, city
2. Email: "invalid-email"
3. Click next

**Expected:**
- ✅ Error: "Invalid email address"
- ✅ Cannot proceed

---

### Test 5.3: Mobile Number Validation

**Setup:**
- Step 1 form open

**Steps:**
1. Country code: India (+91)
2. Mobile: "123" (too short)
3. Click next

**Expected:**
- ✅ Error: "Invalid mobile number"
- ✅ Cannot proceed

---

## Test Suite 6: Edge Cases

### Test 6.1: Rapid Submissions

**Setup:**
- RSVP link open

**Steps:**
1. Fill form completely
2. Click submit
3. Immediately (before success screen) try clicking submit again in browser history

**Expected:**
- ✅ Only one submission created
- ✅ No duplicate guests

---

### Test 6.2: Browser Back Button

**Setup:**
- Success screen showing

**Steps:**
1. On success screen, click browser back button
2. **Verify:** Form appears again

**Expected:**
- ✅ Back button shows form (not re-submit)
- ✅ Can modify and submit again
- ✅ Second submission creates second guest record

---

### Test 6.3: Multiple Tabs

**Setup:**
- RSVP link open in Tab 1
- RSVP link open in Tab 2 (same event)

**Steps:**
1. In Tab 1: Fill form, submit
2. In Tab 2: Fill form with different guest, submit
3. Check guest list

**Expected:**
- ✅ Both guests appear in list
- ✅ Both submissions processed correctly
- ✅ No conflicts or data loss

---

## Test Suite 7: Admin Functionality

### Test 7.1: Admin Can View RSVP Responses

**Setup:**
- Admin account logged in
- Multiple guests submitted RSVPs

**Steps:**
1. Go to event detail
2. Click "View Guest List"
3. **Verify:** All guests visible

**Expected:**
- ✅ All guests from different browsers appear
- ✅ Documents accessible (if uploaded)
- ✅ RSVP details correct

---

### Test 7.2: Admin Can Send Messages to Guests

**Setup:**
- Guest list visible with guests

**Steps:**
1. Select guest
2. Click "Send Message" or "WhatsApp"
3. Fill message
4. Send

**Expected:**
- ✅ Message interface works
- ✅ No errors related to cross-browser data

---

## Test Suite 8: Edge Devices

### Test 8.1: Mobile Browser

**Setup:**
- Smartphone: Chrome or Safari
- RSVP link

**Steps:**
1. Open link on phone
2. Fill form on mobile
3. Submit

**Expected:**
- ✅ Form responsive on mobile
- ✅ Submission successful
- ✅ Guest appears in admin's guest list

---

### Test 8.2: Tablet

**Setup:**
- Tablet: Open RSVP link

**Steps:**
1. Fill and submit

**Expected:**
- ✅ Form works on tablet
- ✅ Submission successful

---

## Quick Checklist

Run through these before declaring "done":

- [ ] **Same browser test**: Guest submits, appears in list
- [ ] **Different browser test**: Guest submits in Firefox, appears when checked in Chrome
- [ ] **Incognito test**: Guest submits in incognito, data persists after close
- [ ] **Error test**: Invalid link shows loading, then error (not blank)
- [ ] **Network test**: Slow network shows spinner, fast network loads quickly
- [ ] **Document test**: Upload 2-3 documents, all persist
- [ ] **Cross-device test**: Guest submits on phone, appears on laptop
- [ ] **Validation test**: Invalid email/mobile rejected
- [ ] **Admin test**: All guests visible in list regardless of submission browser
- [ ] **Console test**: Check console for errors (should be clean)

---

## Performance Baseline

Target metrics:

| Metric | Target | Accept | Concern |
|--------|--------|--------|---------|
| Event load time | < 2 seconds | < 5 seconds | > 10 seconds |
| Form render time | < 500 ms | < 1000 ms | > 3000 ms |
| Submission time | < 3 seconds | < 5 seconds | > 10 seconds |
| Cross-browser sync | < 5 seconds | < 10 seconds | > 30 seconds |

---

## Known Issues to Monitor

1. **Supabase RLS**: If configured incorrectly, anonymous inserts might fail
   - **Check**: Console for "RLS policy violation"
   - **Fix**: Ensure `guests` table allows anonymous inserts

2. **localStorage quota**: On very old browsers, quota might be lower
   - **Check**: Try uploading 2-3 MB documents
   - **Monitor**: Quota error messages

3. **Incognito + offline**: Data might not persist to cloud
   - **Check**: Close incognito while offline, reopen normal mode
   - **Expected**: Guest might not appear if Supabase wasn't saved

---

## Test Results Template

Document test results:

```
Test Date: [DATE]
Tester: [NAME]
Environment: [BROWSER VERSIONS, OS]

Test Suite 1 - Basic Functionality:
- [ ] 1.1 Event Creation: PASS / FAIL
- [ ] 1.2 Same Browser: PASS / FAIL
- [ ] 1.3 Different Browser: PASS / FAIL
- [ ] 1.4 Incognito: PASS / FAIL

Test Suite 2 - Error Handling:
- [ ] 2.1 Invalid Link: PASS / FAIL
- [ ] 2.2 Timeout: PASS / FAIL
- [ ] 2.3 Slow Network: PASS / FAIL

[... continue for all suites ...]

Overall Status: ✅ PASS / ❌ FAIL / ⚠️ ISSUES

Issues Found:
1. [Description]
2. [Description]

Comments:
[Any additional observations]
```

---

## Automated Testing (Future)

Consider adding these tests to CI/CD:

1. Event creation E2E test
2. RSVP submission E2E test
3. Cross-browser localStorage sync test
4. Error handling test
5. Incognito mode data persistence test

---

## Success Criteria

Public RSVP flow is working correctly when:

✅ Event loads in any browser without authentication  
✅ Guest can submit RSVP in any browser  
✅ Guest data persists across browsers and devices  
✅ Incognito mode submissions are retained  
✅ Errors shown clearly (no blank screens)  
✅ Loading indicators shown during async operations  
✅ Documents upload and persist  
✅ No silent failures (all errors visible)  
✅ Admin can see all guests in list regardless of submission browser  
✅ Cross-device sync works (phone → laptop)

---

## Sign-Off

When all tests pass:

- [ ] Testing completed
- [ ] No critical bugs found
- [ ] All error cases handled
- [ ] Cross-browser verified
- [ ] Cross-device verified
- [ ] Performance acceptable
- [ ] Ready for production deployment

**Tested By:** ________________  
**Date:** ________________  
**Status:** ✅ APPROVED / ⚠️ NEEDS FIXES / ❌ BLOCKED
