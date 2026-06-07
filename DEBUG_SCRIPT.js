// RSVP Flow Debugging Script
// Copy and paste this entire script into Browser DevTools Console

console.log('='.repeat(80));
console.log('RSVP FLOW DEBUG SCRIPT');
console.log('='.repeat(80));

// ============================================================================
// 1. CHECK STORED DATA
// ============================================================================

console.log('\n📦 CHECKING STORED DATA...\n');

// Get all events
const allEvents = JSON.parse(localStorage.getItem('wedding_events') || '[]');
console.log('Total events in localStorage:', allEvents.length);
if (allEvents.length > 0) {
  console.log('Events:');
  allEvents.forEach((e, i) => {
    console.log(`  ${i + 1}. ID: ${e.id}`);
    console.log(`     Name: ${e.groomName} & ${e.brideName}`);
    console.log(`     RSVP Token: ${e.rsvpToken}`);
  });
}

// Get all guests
const allGuests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
console.log('\nTotal guests in localStorage:', allGuests.length);
if (allGuests.length > 0) {
  console.log('Guests:');
  allGuests.forEach((g, i) => {
    console.log(`  ${i + 1}. Name: ${g.name}`);
    console.log(`     ID: ${g.id}`);
    console.log(`     Event ID: ${g.eventId}`);
    console.log(`     Email: ${g.email}`);
    console.log(`     ---`);
  });
}

// ============================================================================
// 2. CHECK EVENT ID MATCHING
// ============================================================================

console.log('\n🔗 CHECKING EVENT-GUEST MATCHING...\n');

allEvents.forEach(event => {
  const guestsForThisEvent = allGuests.filter(g => g.eventId === event.id);
  console.log(`Event: ${event.groomName} & ${event.brideName}`);
  console.log(`  Event ID: ${event.id}`);
  console.log(`  Guests for this event: ${guestsForThisEvent.length}`);
  if (guestsForThisEvent.length > 0) {
    guestsForThisEvent.forEach(g => {
      console.log(`    - ${g.name} (${g.email})`);
    });
  }
});

// ============================================================================
// 3. CHECK FOR MISSING EVENT IDS
// ============================================================================

console.log('\n⚠️  CHECKING FOR ISSUES...\n');

const guestsWithoutEventId = allGuests.filter(g => !g.eventId || g.eventId === null);
if (guestsWithoutEventId.length > 0) {
  console.log('❌ ISSUE: Guests without Event ID:', guestsWithoutEventId.length);
  guestsWithoutEventId.forEach(g => {
    console.log(`  - ${g.name} (ID: ${g.id})`);
  });
} else {
  console.log('✅ All guests have Event IDs');
}

// ============================================================================
// 4. DATA QUALITY CHECKS
// ============================================================================

console.log('\n🔍 DATA QUALITY CHECKS\n');

// Check for duplicate guest IDs
const guestIds = allGuests.map(g => g.id);
const duplicateIds = guestIds.filter((id, idx) => guestIds.indexOf(id) !== idx);
if (duplicateIds.length > 0) {
  console.log('❌ WARNING: Duplicate guest IDs found:', duplicateIds);
} else {
  console.log('✅ No duplicate guest IDs');
}

// Check for required fields
const missingFields = allGuests.filter(g => {
  return !g.name || !g.email || !g.mobile || !g.city;
});
if (missingFields.length > 0) {
  console.log('❌ WARNING: Guests missing required fields:', missingFields.length);
  missingFields.forEach(g => {
    const missing = [];
    if (!g.name) missing.push('name');
    if (!g.email) missing.push('email');
    if (!g.mobile) missing.push('mobile');
    if (!g.city) missing.push('city');
    console.log(`  - ${g.id}: missing ${missing.join(', ')}`);
  });
} else {
  console.log('✅ All guests have required fields');
}

// ============================================================================
// 5. HELPER FUNCTIONS
// ============================================================================

console.log('\n🛠️  HELPER FUNCTIONS AVAILABLE\n');

console.log('Call these functions for more debugging:');
console.log('  debugEvent(eventId) - Show details of specific event');
console.log('  debugGuest(guestId) - Show details of specific guest');
console.log('  debugEventGuests(eventId) - Show all guests for event');
console.log('  fixMissingEventIds() - Fix guests without event IDs (experimental)');
console.log('  clearAllData() - Clear all localStorage data (⚠️  CAREFUL!)');

window.debugEvent = function(eventId) {
  console.log('\n📌 EVENT DEBUG\n');
  const event = JSON.parse(localStorage.getItem('wedding_events') || '[]').find(e => e.id === eventId);
  if (event) {
    console.log('Event found:');
    console.log(JSON.stringify(event, null, 2));
  } else {
    console.log('❌ Event not found with ID:', eventId);
  }
};

window.debugGuest = function(guestId) {
  console.log('\n👤 GUEST DEBUG\n');
  const guest = JSON.parse(localStorage.getItem('wedding_guests') || '[]').find(g => g.id === guestId);
  if (guest) {
    console.log('Guest found:');
    console.log(JSON.stringify(guest, null, 2));
  } else {
    console.log('❌ Guest not found with ID:', guestId);
  }
};

window.debugEventGuests = function(eventId) {
  console.log(`\n📋 GUESTS FOR EVENT: ${eventId}\n`);
  const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]').filter(g => g.eventId === eventId);
  console.log(`Found ${guests.length} guests:`);
  console.log(JSON.stringify(guests, null, 2));
};

window.fixMissingEventIds = function() {
  console.log('\n🔧 FIXING MISSING EVENT IDS\n');
  console.log('⚠️  WARNING: This is experimental. Backup your data first!');
  
  const events = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  const guests = JSON.parse(localStorage.getItem('wedding_guests') || '[]');
  
  if (events.length === 0) {
    console.log('❌ No events found. Cannot fix without an event ID.');
    return;
  }
  
  const firstEventId = events[0].id;
  console.log(`Using first event ID: ${firstEventId}`);
  
  let fixed = 0;
  const updatedGuests = guests.map(g => {
    if (!g.eventId || g.eventId === null) {
      console.log(`  Fixing guest: ${g.name}`);
      fixed++;
      return { ...g, eventId: firstEventId };
    }
    return g;
  });
  
  localStorage.setItem('wedding_guests', JSON.stringify(updatedGuests));
  console.log(`✅ Fixed ${fixed} guests`);
  console.log('Refresh the page to see changes');
};

window.clearAllData = function() {
  if (confirm('⚠️  ARE YOU SURE? This will delete ALL event and guest data!')) {
    if (confirm('FINAL WARNING: This cannot be undone!')) {
      localStorage.removeItem('wedding_events');
      localStorage.removeItem('wedding_guests');
      console.log('✅ All data cleared');
      location.reload();
    }
  }
};

// ============================================================================
// 6. SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

console.log(`Total Events: ${allEvents.length}`);
console.log(`Total Guests: ${allGuests.length}`);

if (allEvents.length > 0 && allGuests.length > 0) {
  let totalMatched = 0;
  allEvents.forEach(event => {
    const count = allGuests.filter(g => g.eventId === event.id).length;
    totalMatched += count;
  });
  console.log(`Guests linked to events: ${totalMatched}`);
  console.log(`Guests without event link: ${allGuests.length - totalMatched}`);
}

console.log('\n🎯 Next steps:');
console.log('1. If guests are missing: Check EventID matching above');
console.log('2. If eventId is null: Run fixMissingEventIds() to attempt fix');
console.log('3. If data is wrong: Review event and guest details');
console.log('4. If still broken: Clear data and try again');

console.log('\n' + '='.repeat(80) + '\n');
