// This test runs in the browser console to diagnose event persistence
console.log('='.repeat(80));
console.log('🔍 EVENT CREATION PERSISTENCE TEST');
console.log('='.repeat(80));

// 1. Check if window.localStorage is available
console.log('\n1. Checking localStorage availability...');
if (typeof localStorage === 'undefined') {
  console.error('❌ localStorage is NOT available!');
  console.log('   This would prevent ALL data from being persisted.');
  console.log('   Check if you are in a Private/Incognito window.');
} else {
  console.log('✅ localStorage is available');
}

// 2. Check current state of events
console.log('\n2. Current events in localStorage:');
try {
  const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  console.log(`   Total events: ${events.length}`);
  if (events.length > 0) {
    events.forEach((e, i) => {
      console.log(`   Event ${i + 1}: ${e.groomName} & ${e.brideName} (ID: ${e.id})`);
      console.log(`      RSVP Token: ${e.rsvpToken}`);
      console.log(`      Created: ${e.createdAt}`);
    });
  } else {
    console.log('   ⚠️  No events found');
  }
} catch (err) {
  console.error('   ❌ Error reading events:', err.message);
}

// 3. Simulate what createEvent should do
console.log('\n3. Testing manual event save (simulating createEvent):');
try {
  const testEvent = {
    id: 'test-' + Date.now(),
    rsvpToken: 'token-' + Date.now(),
    groomName: 'Test Groom',
    brideName: 'Test Bride',
    coupleStory: 'Test story',
    weddingDate: '2026-12-25',
    venue: 'Test Venue',
    description: 'Test description',
    coverImage: '',
    createdBy: 'test-user',
    createdAt: new Date().toISOString(),
  };
  
  const currentEvents = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  console.log(`   Current events before save: ${currentEvents.length}`);
  
  currentEvents.push(testEvent);
  localStorage.setItem('wedding_events', JSON.stringify(currentEvents));
  
  const afterSave = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  console.log(`   ✅ Events after save: ${afterSave.length}`);
  console.log(`   New event saved successfully!`);
} catch (err) {
  console.error('   ❌ Error during test save:', err.message);
}

// 4. Check guests
console.log('\n4. Current guests in localStorage:');
try {
  const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
  console.log(`   Total guests: ${guests.length}`);
  if (guests.length > 0) {
    guests.slice(0, 3).forEach((g, i) => {
      console.log(`   Guest ${i + 1}: ${g.name} (Event ID: ${g.eventId})`);
    });
    if (guests.length > 3) {
      console.log(`   ... and ${guests.length - 3} more`);
    }
  }
} catch (err) {
  console.error('   ❌ Error reading guests:', err.message);
}

// 5. Check localStorage quota
console.log('\n5. localStorage Usage:');
try {
  let totalSize = 0;
  const items = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      const size = (value?.length || 0) / 1024;
      items[key] = size;
      totalSize += size;
    }
  }
  console.log(`   Total used: ${totalSize.toFixed(2)} KB`);
  Object.entries(items).forEach(([key, size]) => {
    if (size > 1) { // Only show items > 1 KB
      console.log(`   - ${key}: ${size.toFixed(2)} KB`);
    }
  });
} catch (err) {
  console.error('   ❌ Error checking storage:', err.message);
}

console.log('\n' + '='.repeat(80));
console.log('🔧 NEXT STEPS:');
console.log('='.repeat(80));
console.log('1. Try creating an event in the admin dashboard');
console.log('2. After creation, run this script again');
console.log('3. Compare the "events before save" and "events after save" numbers');
console.log('4. If events are still 0, check browser console for any createEvent errors');
console.log('='.repeat(80));
