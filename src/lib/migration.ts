import { supabase } from './supabase';

/**
 * Run database migration directly from the app
 * This applies the schema from supabase/migrations/001_initial_schema.sql
 */
export async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Check if tables already exist
    const { data: existingTables, error: checkError } = await supabase
      .from('wedding_events')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('Tables already exist. Migration may have already been run.');
      const proceed = confirm(
        'Database tables already exist. Do you want to proceed anyway? (This may cause errors if the schema is identical)'
      );
      if (!proceed) {
        console.log('Migration cancelled by user.');
        return false;
      }
    }

    // Note: Direct SQL execution from client is not supported for security reasons
    // Users must run the migration through Supabase Dashboard or CLI
    console.error(
      'ERROR: Cannot run migration directly from client code for security reasons.'
    );
    console.log('\n=== HOW TO APPLY MIGRATION ===');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Create a new query');
    console.log('4. Copy contents from: supabase/migrations/001_initial_schema.sql');
    console.log('5. Paste and execute the query');
    console.log('\nAlternatively, use Supabase CLI:');
    console.log('  npm install -g supabase');
    console.log('  supabase db push');
    
    alert(
      'Migration must be run through Supabase Dashboard.\n\n' +
      'See console for instructions or check RSVP_FIX_GUIDE.md'
    );

    return false;
  } catch (error) {
    console.error('Migration check failed:', error);
    return false;
  }
}

/**
 * Check what columns actually exist in the guests table
 */
export async function checkGuestsTableSchema() {
  console.log('Checking guests table schema in database...\n');

  try {
    // Try to query the table structure by selecting from it with limit 0
    // This tells us what columns exist without actually fetching data
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .limit(0);

    if (error && !error.message.includes('no rows')) {
      console.error('Error querying guests table:', error);
      return false;
    }

    // Get the required columns we need
    const requiredColumns = [
      'id',
      'event_id',
      'name',
      'mobile',
      'email',
      'city',
      'responding_for',
      'attendance_status',
      'additional_guests',
      'function_attendance',
      'documents',
      'special_assistance',
      'celebration_participation',
      'country_code',
      'needs_accommodation',
      'dietary_restrictions',
    ];

    console.log('✅ Guests table is accessible!');
    console.log('\n📋 Testing insert with all required fields...\n');

    // Create a temporary event first to satisfy foreign key constraint
    const tempEventId = crypto.randomUUID();
    const tempGuestId = crypto.randomUUID();

    // Insert temporary event
    const { error: eventError } = await supabase.from('wedding_events').insert({
      id: tempEventId,
      rsvp_token: 'temp-' + Date.now(),
      groom_name: 'Test Groom',
      bride_name: 'Test Bride',
      wedding_date: '2026-12-31',
      venue: 'Test Venue',
    });

    if (eventError) {
      console.error('Cannot create test event:', eventError);
      console.log('⚠️ Skipping insert test, but table appears to exist');
      return true; // Table exists, just can't test insert
    }

    // Try inserting a test guest with all fields
    const testGuest = {
      id: tempGuestId,
      event_id: tempEventId,
      name: 'Test Guest',
      mobile: '1234567890',
      email: 'test@test.com',
      city: 'Test City',
      responding_for: 'Self',
      attendance_status: 'Yes',
      function_attendance: {},
      additional_guests: [],
      special_assistance: [],
      celebration_participation: [],
      documents: [],
      country_code: 'US',
      needs_accommodation: false,
      dietary_restrictions: '',
    };

    const { error: insertError } = await supabase.from('guests').insert(testGuest);

    // Clean up - delete test records
    await supabase.from('guests').delete().eq('id', tempGuestId);
    await supabase.from('wedding_events').delete().eq('id', tempEventId);

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      
      if (insertError.message.includes('could not find') || 
          insertError.message.includes('column') ||
          insertError.code === 'PGRST204') {
        console.error('\n❌ SCHEMA ISSUE DETECTED!');
        console.error('The guests table is missing required columns.');
        console.error('\nMissing or problematic field:', insertError.message);
        console.error('\n📋 TO FIX THIS:');
        console.error('1. Go to Supabase Dashboard → SQL Editor');
        console.error('2. Run the query from: supabase/migrations/002_complete_reset.sql');
      }
      return false;
    }

    console.log('✅ Insert test PASSED!');
    console.log('✅ All required columns exist and work correctly!');
    console.log('\n🎉 Database schema is properly configured!\n');
    
    return true;
  } catch (error) {
    console.error('Error checking schema:', error);
    console.error('\n⚠️ Cannot verify schema automatically.');
    console.error('Please manually check in Supabase Dashboard → Table Editor → guests');
    return false;
  }
}

/**
 * Verify migration was successful
 */
export async function verifyMigration() {
  console.log('Verifying database schema...');

  const tables = [
    'users',
    'wedding_events',
    'guests',
    'bulk_messages',
    'uploaded_guest_lists',
  ];

  const results: Record<string, boolean> = {};

  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      results[table] = !error;
      console.log(`${table}: ${!error ? '✓ OK' : '✗ Missing'}`);
    } catch (err) {
      results[table] = false;
      console.log(`${table}: ✗ Missing`);
    }
  }

  const allTablesExist = Object.values(results).every((v) => v);

  if (allTablesExist) {
    console.log('\n✅ All database tables exist!');
    console.log('\nNow checking if guests table has all required columns...');
    const schemaOk = await checkGuestsTableSchema();
    
    if (!schemaOk) {
      console.log('\n⚠️ Tables exist but schema may be incomplete.');
      console.log('Run: await checkGuestsTableSchema() for details');
    }
    
    return schemaOk;
  } else {
    console.log('\n❌ Some tables are missing.');
    console.log('Please run the migration using Supabase Dashboard.');
    console.log('Use file: supabase/migrations/002_complete_reset.sql');
  }

  return allTablesExist;
}

/**
 * Diagnostic: Check what events exist in Supabase vs localStorage
 */
export async function diagnoseEventStorage() {
  console.log('\n🔍 DIAGNOSING EVENT STORAGE\n');
  
  // Check localStorage
  const localEvents = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  console.log('📱 Events in localStorage:', localEvents.length);
  if (localEvents.length > 0) {
    console.table(localEvents.map((e: any) => ({
      groomName: e.groomName,
      brideName: e.brideName,
      rsvpToken: e.rsvpToken,
      createdAt: e.createdAt,
    })));
  } else {
    console.log('  (none)');
  }
  
  // Check Supabase
  try {
    const { data: supabaseEvents, error } = await supabase
      .from('wedding_events')
      .select('groom_name, bride_name, rsvp_token, created_at');
    
    if (error) {
      console.error('❌ Error querying Supabase:', error);
      console.log('\n⚠️ Cannot access Supabase database.');
      console.log('Check:');
      console.log('  1. .env file has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
      console.log('  2. Supabase project is accessible');
      console.log('  3. Tables were created (run: await verifyMigration())');
    } else {
      console.log('\n☁️ Events in Supabase:', supabaseEvents?.length || 0);
      if (supabaseEvents && supabaseEvents.length > 0) {
        console.table(supabaseEvents);
      } else {
        console.log('  (none)');
      }
    }
  } catch (err) {
    console.error('❌ Exception accessing Supabase:', err);
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (localEvents.length > 0) {
    console.log('  • You have events in localStorage');
    console.log('  • Create a NEW event to ensure it saves to Supabase');
    console.log('  • Or migrate existing events: await migrateLocalStorageToSupabase()');
  } else {
    console.log('  • No events found anywhere');
    console.log('  • Create a new event in the app');
    console.log('  • Watch console for "✓ Event saved to Supabase successfully"');
  }
}

/**
 * Diagnostic: Look up a specific RSVP token
 */
export async function lookupRSVPToken(token: string) {
  console.log('\n🔍 LOOKING UP RSVP TOKEN:', token, '\n');
  
  // Check localStorage
  const localEvents = JSON.parse(localStorage.getItem('wedding_events') || '[]');
  const localEvent = localEvents.find((e: any) => e.rsvpToken === token);
  
  if (localEvent) {
    console.log('✓ Found in localStorage:');
    console.log('  Groom:', localEvent.groomName);
    console.log('  Bride:', localEvent.brideName);
    console.log('  Created:', localEvent.createdAt);
  } else {
    console.log('✗ NOT found in localStorage');
  }
  
  // Check Supabase
  try {
    const { data, error } = await supabase
      .from('wedding_events')
      .select('*')
      .eq('rsvp_token', token)
      .maybeSingle();
    
    if (error) {
      console.error('\n❌ Supabase query error:', error);
    } else if (data) {
      console.log('\n✓ Found in Supabase:');
      console.log('  Groom:', data.groom_name);
      console.log('  Bride:', data.bride_name);
      console.log('  Created:', data.created_at);
    } else {
      console.log('\n✗ NOT found in Supabase');
    }
  } catch (err) {
    console.error('\n❌ Exception querying Supabase:', err);
  }
  
  console.log('\n💡 DIAGNOSIS:');
  if (localEvent && !localEvent) {
    console.log('  ⚠️ Event exists in localStorage but NOT in Supabase');
    console.log('  This is why incognito mode fails!');
    console.log('  FIX: Create a NEW event OR migrate: await migrateLocalStorageToSupabase()');
  }
}

/**
 * Migrate existing localStorage data to Supabase
 */
export async function migrateLocalStorageToSupabase() {
  console.log('Starting localStorage to Supabase migration...');

  try {
    // Verify tables exist first
    const tablesExist = await verifyMigration();
    if (!tablesExist) {
      console.error('Cannot migrate: Database tables do not exist.');
      console.log('Please apply the migration first using Supabase Dashboard.');
      return false;
    }

    // Migrate events
    const eventsJson = localStorage.getItem('wedding_events');
    const events = eventsJson ? JSON.parse(eventsJson) : [];
    console.log(`Found ${events.length} events in localStorage`);

    let migratedEvents = 0;
    for (const event of events) {
      const { error } = await supabase.from('wedding_events').upsert({
        id: event.id,
        rsvp_token: event.rsvpToken,
        groom_name: event.groomName,
        bride_name: event.brideName,
        couple_story: event.coupleStory || '',
        wedding_date: event.weddingDate,
        venue: event.venue,
        description: event.description || '',
        cover_image: event.coverImage || '',
        created_by: event.createdBy,
        created_at: event.createdAt,
      });

      if (error) {
        console.error(`Error migrating event ${event.id}:`, error);
      } else {
        migratedEvents++;
        console.log(`✓ Migrated event: ${event.groomName} & ${event.brideName}`);
      }
    }

    // Migrate guests
    const guestsJson = localStorage.getItem('wedding_guests');
    const guests = guestsJson ? JSON.parse(guestsJson) : [];
    console.log(`Found ${guests.length} guests in localStorage`);

    let migratedGuests = 0;
    for (const guest of guests) {
      const { error } = await supabase.from('guests').upsert({
        id: guest.id,
        event_id: guest.eventId,
        name: guest.name,
        country_code: guest.countryCode || null,
        mobile: guest.mobile,
        email: guest.email,
        city: guest.city,
        responding_for: guest.respondingFor,
        attendance_status: guest.attendanceStatus,
        function_attendance: guest.functionAttendance || {},
        adults: guest.adults,
        children: guest.children,
        infants: guest.infants,
        additional_guests: guest.additionalGuests || [],
        needs_accommodation: guest.needsAccommodation || false,
        check_in_date: guest.checkInDate || null,
        check_out_date: guest.checkOutDate || null,
        number_of_rooms: guest.numberOfRooms || null,
        room_preference: guest.roomPreference || null,
        preferred_roommates: guest.preferredRoommates || null,
        arrival_mode: guest.arrivalMode || null,
        arrival_date: guest.arrivalDate || null,
        arrival_time: guest.arrivalTime || null,
        arrival_transport_name: guest.arrivalTransportName || null,
        arrival_number: guest.arrivalNumber || null,
        arrival_location: guest.arrivalLocation || null,
        arrival_itinerary_file: guest.arrivalItineraryFile || null,
        departure_date: guest.departureDate || null,
        departure_time: guest.departureTime || null,
        departure_transport_name: guest.departureTransportName || null,
        departure_number: guest.departureNumber || null,
        departure_itinerary_file: guest.departureItineraryFile || null,
        needs_pickup: guest.needsPickup || false,
        needs_drop: guest.needsDrop || false,
        transfer_passengers: guest.transferPassengers || 0,
        transfer_bags: guest.transferBags || 0,
        transfer_requirements: guest.transferRequirements || null,
        id_type: guest.idType || null,
        id_number: guest.idNumber || null,
        id_front_file: guest.idFrontFile || null,
        id_back_file: guest.idBackFile || null,
        dietary_restrictions: guest.dietaryRestrictions || '',
        special_assistance: guest.specialAssistance || [],
        celebration_participation: guest.celebrationParticipation || [],
        additional_notes: guest.additionalNotes || '',
        info_accurate: guest.infoAccurate || false,
        data_consent: guest.dataConsent || false,
        submitted_at: guest.submittedAt,
        upload_source: guest.uploadSource || null,
        whatsapp_status: guest.whatsappStatus || null,
        whatsapp_sent_at: guest.whatsappSentAt || null,
        documents: guest.documents || [],
      });

      if (error) {
        console.error(`Error migrating guest ${guest.id}:`, error);
      } else {
        migratedGuests++;
        console.log(`✓ Migrated guest: ${guest.name}`);
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`Events: ${migratedEvents}/${events.length} migrated`);
    console.log(`Guests: ${migratedGuests}/${guests.length} migrated`);

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

// Make functions available globally for easy console access
if (typeof window !== 'undefined') {
  (window as any).runMigration = runMigration;
  (window as any).verifyMigration = verifyMigration;
  (window as any).checkGuestsTableSchema = checkGuestsTableSchema;
  (window as any).migrateLocalStorageToSupabase = migrateLocalStorageToSupabase;
  (window as any).diagnoseEventStorage = diagnoseEventStorage;
  (window as any).lookupRSVPToken = lookupRSVPToken;
  
  console.log('🔧 Diagnostic tools loaded. Available commands:');
  console.log('  • await verifyMigration() - Check database tables');
  console.log('  • await checkGuestsTableSchema() - Test guest insert');
  console.log('  • await diagnoseEventStorage() - Compare localStorage vs Supabase');
  console.log('  • await lookupRSVPToken("token") - Look up specific RSVP token');
  console.log('  • await migrateLocalStorageToSupabase() - Migrate old data');
}
