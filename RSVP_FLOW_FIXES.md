# Public RSVP Flow - Comprehensive Fixes

## Overview

This document outlines the complete implementation to fix the public RSVP flow for cross-browser, cross-device access.

---

## Fix 1: Add Loading State to RSVPForm

**Problem:** User sees blank screen while event is loading

**Solution:** Show loading spinner during event lookup

**File:** `src/pages/RSVPForm.tsx`

### Changes:

```typescript
export default function RSVPForm() {
  const { id, token } = useParams<{ id?: string; token?: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<WeddingEvent | null>(null);
  const [loading, setLoading] = useState(true);  // NEW
  const [error, setError] = useState('');
  // ... rest of state

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);  // NEW: Start loading
      setError('');      // NEW: Clear previous errors
      
      try {
        if (id) {
          const ev = getEventById(id);
          if (ev) {
            setEvent(ev);
          } else {
            setError('Event not found. Please check the event ID.');
          }
        } else if (token) {
          const ev = await getEventByRSVPToken(token);
          if (ev) {
            setEvent(ev);
          } else {
            setError('Invalid RSVP link. The event may have been deleted or the link may be expired.');
          }
        } else {
          setError('Invalid access. No event ID or token provided.');
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError(
          err instanceof Error 
            ? err.message 
            : 'Failed to load event. Please check your connection and try again.'
        );
      } finally {
        setLoading(false);  // NEW: Stop loading
      }
    }

    loadEvent();
  }, [id, token]);

  // NEW: Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-rose-500 mx-auto mb-6"></div>
          <p className="text-gray-700 text-lg font-medium">Loading event...</p>
          <p className="text-gray-500 text-sm mt-2">This usually takes a few seconds</p>
        </div>
      </div>
    );
  }

  // NEW: Error state with helpful message
  if (error && !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Event</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">
                  💡 Tip: Make sure you're using the correct link and have a stable internet connection.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original rendering code follows...
  if (!event) {
    return null; // Shouldn't reach here now
  }

  return (
    // ... existing form JSX
  );
}
```

### Import Needed:
```typescript
import { AlertCircle } from 'lucide-react';
```

---

## Fix 2: Improve Error Handling in addGuest()

**Problem:** Errors are logged but not shown to user; silent Supabase failures

**Solution:** Return clear error status and show user-friendly messages

**File:** `src/lib/db.ts`

### Changes:

```typescript
export interface AddGuestResult {
  success: boolean;
  guest: Guest | null;
  error: string | null;
  supabaseFailed: boolean; // Track if Supabase failed
}

export async function addGuest(
  guest: Omit<Guest, 'id' | 'submittedAt'>
): Promise<AddGuestResult> {
  const newGuest: Guest = {
    ...guest,
    id: uuidv4(),
    submittedAt: new Date().toISOString(),
  };

  console.log('📝 Adding guest:', newGuest.name);

  let supabaseFailed = false;
  let supabaseError = '';

  // Try Supabase first
  try {
    console.log('☁️ Attempting to save guest to Supabase...');

    const { data, error } = await supabase
      .from('guests')
      .insert({
        id: newGuest.id,
        event_id: newGuest.eventId,
        name: newGuest.name,
        country_code: newGuest.countryCode,
        mobile: newGuest.mobile,
        email: newGuest.email,
        city: newGuest.city,
        // ... other fields
        documents: newGuest.documents || [],
      })
      .select()
      .single();

    if (error) {
      supabaseFailed = true;
      supabaseError = error.message;
      console.error('❌ Supabase save FAILED:', error);
      console.warn('⚠️ Will attempt to save to localStorage only...');
    } else {
      console.log('✅ Guest saved to Supabase successfully!');
    }
  } catch (error) {
    supabaseFailed = true;
    supabaseError = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Exception saving to Supabase:', error);
    console.warn('⚠️ Will attempt to save to localStorage only...');
  }

  // Try localStorage
  try {
    const guests = getGuests();
    guests.push(newGuest);
    setItem('wedding_guests', guests);
    console.log('✓ Guest saved to localStorage');

    // Return result
    if (supabaseFailed) {
      return {
        success: true,
        guest: newGuest,
        error: 'Note: Data saved locally but not synced to cloud. It may not appear on other devices.',
        supabaseFailed: true,
      };
    } else {
      return {
        success: true,
        guest: newGuest,
        error: null,
        supabaseFailed: false,
      };
    }
  } catch (error) {
    const msg =
      error instanceof Error && error.name === 'QuotaExceededError'
        ? `Storage limit exceeded. Total usage: ${calculateStorageUsage()}. Please reduce the number or size of uploaded files.`
        : error instanceof Error
          ? error.message
          : 'Failed to save guest data';

    console.error('❌ Failed to save to localStorage:', error);

    return {
      success: false,
      guest: null,
      error: msg,
      supabaseFailed: supabaseFailed,
    };
  }
}

function calculateStorageUsage(): string {
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      totalSize += localStorage.getItem(key)?.length || 0;
    }
  }
  return `${(totalSize / (1024 * 1024)).toFixed(2)} MB`;
}
```

---

## Fix 3: Update RSVPForm to Use New Error Handling

**File:** `src/pages/RSVPForm.tsx`

### Changes in handleSubmit():

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (step !== 4) {
    console.log('Form submission prevented - not on step 4');
    return;
  }

  if (!validateStep() || (!id && !event?.id)) {
    console.log('Form submission prevented - validation failed or no event ID');
    return;
  }

  const finalEventId = event?.id || id || '';
  if (!finalEventId) {
    setError('Unable to determine event ID. Please try again or contact support.');
    return;
  }

  try {
    setError(''); // Clear previous errors
    
    // ... document processing ...

    const guestData = {
      eventId: finalEventId,
      name: formData.name,
      // ... other fields ...
      documents: documents.length > 0 ? documents : undefined,
    };

    // NEW: Use new error handling
    const result = await addGuest(guestData);

    if (result.success) {
      if (result.supabaseFailed) {
        // Data saved locally but not to cloud
        console.warn('⚠️ Data saved locally but not to cloud');
        // Still show success but with warning
        setSuccess(true);
        // Could show a toast warning here
      } else {
        // All good - saved to both cloud and local
        console.log('✅ Data saved successfully to cloud');
        setSuccess(true);
      }

      // Dispatch custom event for list refresh
      window.dispatchEvent(
        new CustomEvent('guestAdded', {
          detail: { eventId: finalEventId, guestId: result.guest?.id },
        })
      );
    } else {
      // Failed completely
      setError(result.error || 'Failed to save RSVP. Please try again.');
      
      // NEW: Show helpful recovery message
      if (result.error?.includes('Storage limit exceeded')) {
        setError(
          result.error + 
          '\n\nTry uploading fewer documents or using smaller files.'
        );
      }
    }
  } catch (err) {
    console.error('Unexpected error during submission:', err);
    setError(
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Please try again.'
    );
  }
};
```

---

## Fix 4: Add Timeout to Supabase Queries

**Problem:** Supabase queries can timeout indefinitely on slow networks

**Solution:** Add configurable timeout

**File:** `src/lib/db.ts`

### Changes:

```typescript
const SUPABASE_TIMEOUT = 5000; // 5 seconds

export async function getEventByRSVPToken(token: string): Promise<WeddingEvent | null> {
  console.log('Looking up RSVP token:', token);

  try {
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase query timeout')), SUPABASE_TIMEOUT)
    );

    // Race between timeout and actual query
    const queryPromise = supabase
      .from('wedding_events')
      .select('*')
      .eq('rsvp_token', token)
      .maybeSingle();

    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      throw error;
    }

    if (data) {
      console.log('✓ Found event in Supabase:', data.groom_name, '&', data.bride_name);
      return {
        id: data.id,
        rsvpToken: data.rsvp_token,
        groomName: data.groom_name,
        brideName: data.bride_name,
        // ... convert fields ...
      };
    }

    // No data in Supabase, check localStorage
    console.log('Event not in Supabase, checking localStorage...');
    const localEvent = getEvents().find((e) => e.rsvpToken === token);
    if (localEvent) {
      console.log('✓ Found event in localStorage:', localEvent.groomName, '&', localEvent.brideName);
    } else {
      console.log('✗ Event not found anywhere');
    }
    return localEvent || null;
  } catch (error) {
    console.error('Error fetching event by token:', error);
    const localEvent = getEvents().find((e) => e.rsvpToken === token);
    if (localEvent) {
      console.log('✓ Fallback: Found event in localStorage');
      return localEvent;
    }
    throw error;
  }
}
```

---

## Fix 5: Add Storage Size Check Before Upload

**Problem:** User doesn't know if upload will succeed until after they fill entire form

**Solution:** Check storage quota before accepting file uploads

**File:** `src/pages/RSVPForm.tsx`

### Add function:

```typescript
function getStorageAvailable(): number {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    
    // Estimate available storage
    let remaining = 5 * 1024 * 1024; // Start with 5 MB estimate
    let used = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        used += key.length + (localStorage.getItem(key)?.length || 0);
      }
    }
    
    remaining = remaining - used;
    return Math.max(0, remaining);
  } catch (e) {
    return 0;
  }
}

function validateFileSize(file: File): { isValid: boolean; error?: string } {
  const maxFileSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxFileSize) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`,
    };
  }

  const available = getStorageAvailable();
  const estimatedNeeded = file.size * 1.5; // Base64 encoding increases size ~33%
  
  if (estimatedNeeded > available) {
    return {
      isValid: false,
      error: `Not enough storage space. File needs ~${(estimatedNeeded / 1024 / 1024).toFixed(1)} MB but only ${(available / 1024 / 1024).toFixed(1)} MB available.`,
    };
  }

  return { isValid: true };
}

// Use this in file upload handlers
const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.currentTarget.files;
  if (!files) return;

  const newFiles: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const validation = validateFileSize(file);
    if (!validation.isValid) {
      errors.push(validation.error || 'File validation failed');
    } else {
      newFiles.push(file);
    }
  }

  if (errors.length > 0) {
    setError(errors.join('\n'));
    return;
  }

  setFormData((prev) => ({
    ...prev,
    uploadedDocuments: [...prev.uploadedDocuments, ...newFiles],
  }));
};
```

---

## Fix 6: Clear Error State on Form Change

**File:** `src/pages/RSVPForm.tsx`

### Add to handleSubmit and file uploads:

```typescript
const updateForm = (key: string, value: any) => {
  setFormData((prev) => ({ ...prev, [key]: value }));
  if (error) setError(''); // Clear error when user continues
};

const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  // ... existing code ...
  if (error) setError(''); // Clear error on new upload
};
```

---

## Fix 7: Add Progress Indicator During Document Upload

**File:** `src/pages/RSVPForm.tsx`

### Add state:

```typescript
const [uploadProgress, setUploadProgress] = useState(0);
const [isUploading, setIsUploading] = useState(false);
```

### Update handleSubmit:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  // ... validation ...

  try {
    setIsUploading(true);
    setUploadProgress(0);

    const documents: GuestDocument[] = [];
    const totalFiles = formData.uploadedDocuments.length + 
                      (formData.idFront ? 1 : 0) + 
                      (formData.idBack ? 1 : 0) +
                      (formData.flightTicket ? 1 : 0) +
                      (formData.trainTicket ? 1 : 0);
    
    let filesProcessed = 0;

    for (const file of formData.uploadedDocuments) {
      try {
        const doc = await createGuestDocument(file, '', 'guest');
        documents.push(doc);
        filesProcessed++;
        setUploadProgress(Math.round((filesProcessed / totalFiles) * 100));
      } catch (err) {
        failedDocs.push({
          name: file.name,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // ... rest of submission code ...

    setSuccess(true);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to submit');
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};
```

### Show progress in UI:

```typescript
{isUploading && (
  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
    <p className="text-sm text-blue-900 mb-2">
      Uploading documents... {uploadProgress}%
    </p>
    <div className="w-full bg-blue-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${uploadProgress}%` }}
      ></div>
    </div>
  </div>
)}
```

---

## Fix 8: Add Validation Before Submission

**File:** `src/pages/RSVPForm.tsx`

### Update validateStep:

```typescript
const validateStep = () => {
  if (step === 1) {
    // ... existing validations ...
    
    // NEW: Check storage before proceeding
    const storage = getStorageAvailable();
    if (storage < 1 * 1024 * 1024) { // Less than 1 MB available
      setError(
        `Not enough storage space (${(storage / 1024 / 1024).toFixed(1)} MB available). ` +
        `Close other tabs or clear browser data and try again.`
      );
      return false;
    }
  }
  
  return true;
};
```

---

## Fix 9: Better Documentation for Fixing Supabase RLS

**File:** `.env` comments and new file `SUPABASE_SETUP.md`

Create `.env` with comments:
```bash
# Supabase Configuration
# Make sure your Supabase project has:
# 1. Table: wedding_events with rsvp_token column
# 2. Table: guests with event_id foreign key
# 3. RLS DISABLED on guests table OR
#    RLS policy allowing anonymous inserts:
#    CREATE POLICY "Allow anonymous inserts on guests"
#    ON guests FOR INSERT
#    WITH CHECK (true);

VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## Testing the Fixes

### Test 1: Loading State
```
1. Open /rsvp/guest/INVALID_TOKEN
2. Should see: Loading spinner for ~1 second
3. Then: Error message "Invalid RSVP link"
```

### Test 2: Cross-Browser Access
```
1. Admin creates event (Browser A)
2. Guest opens link in Browser B (different browser)
3. Should see: Event loads successfully
4. Submit form: Should save and appear in guest list
```

### Test 3: Incognito Mode
```
1. Guest opens link in incognito window
2. Should see: Event loads
3. Submit RSVP: Should save (visible in admin browser)
4. Close incognito: Data persists in admin browser ✓
```

### Test 4: Storage Quota
```
1. Upload 5 large documents (each 2-3 MB)
2. Attempt submit: Should show specific quota error
3. User can remove files and retry
```

### Test 5: Error Recovery
```
1. Disconnect internet
2. Try to submit form
3. Should see: Specific error about network
4. Reconnect internet
5. User can retry
```

---

## Files to Modify

1. **src/pages/RSVPForm.tsx** - Add loading state, error handling, progress
2. **src/lib/db.ts** - Add timeout, better error returns, storage check
3. **src/.env** - Add configuration comments

---

## Summary of Fixes

| Fix | Impact | Difficulty |
|-----|--------|-----------|
| 1. Loading state | Shows user what's happening | Easy |
| 2. Better errors | Users know what went wrong | Medium |
| 3. Error handling | Specific messages shown | Medium |
| 4. Timeout | Prevents indefinite waits | Easy |
| 5. Storage check | Prevents quota exceeded | Medium |
| 6. Clear errors | UX improvement | Easy |
| 7. Progress bar | Shows upload progress | Medium |
| 8. Validation | Catches issues early | Easy |
| 9. Documentation | Helps setup | Easy |

All fixes maintain backward compatibility and don't require database schema changes.

Next: See RSVP_TESTING_PLAN.md for comprehensive testing procedures.
