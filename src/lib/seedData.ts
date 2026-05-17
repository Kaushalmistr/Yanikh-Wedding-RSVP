import { v4 as uuidv4 } from 'uuid';
import type { User, WeddingEvent, Guest, BulkMessage, UploadedGuestList } from './db';

// Clear all existing data and populate with dummy data
export function seedDummyData() {
  // Generate dummy users
  const users: User[] = [
    {
      id: uuidv4(),
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      mobile: '9876543210',
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Rahul Verma',
      email: 'rahul.verma@email.com',
      mobile: '9876543211',
      createdAt: new Date('2026-02-10').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Ananya Patel',
      email: 'ananya.patel@email.com',
      mobile: '9876543212',
      createdAt: new Date('2026-02-20').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Vikram Singh',
      email: 'vikram.singh@email.com',
      mobile: '9876543213',
      createdAt: new Date('2026-03-05').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Neha Kapoor',
      email: 'neha.kapoor@email.com',
      mobile: '9876543214',
      createdAt: new Date('2026-03-12').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Arjun Reddy',
      email: 'arjun.reddy@email.com',
      mobile: '9876543215',
      createdAt: new Date('2026-03-20').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Divya Nair',
      email: 'divya.nair@email.com',
      mobile: '9876543216',
      createdAt: new Date('2026-04-01').toISOString(),
    },
    {
      id: uuidv4(),
      name: 'Karan Malhotra',
      email: 'karan.malhotra@email.com',
      mobile: '9876543217',
      createdAt: new Date('2026-04-10').toISOString(),
    },
  ];

  // Generate dummy wedding events
  const events: WeddingEvent[] = [
    {
      id: uuidv4(),
      groomName: 'Yuvraj Khanna',
      brideName: 'Nanki Sharma',
      coupleStory: 'We met during a college fest in 2020 and instantly connected over our love for music and travel. After 6 years of friendship and love, we are ready to start our forever journey together.',
      weddingDate: '2026-12-15',
      venue: 'The Grand Palace, New Delhi',
      description: 'Join us as we celebrate our union with three days of festivities, including Mehendi, Sangeet, and the grand wedding ceremony.',
      coverImage: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
      createdBy: users[0].id,
      createdAt: new Date('2026-03-01').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Rohan Gupta',
      brideName: 'Meera Joshi',
      coupleStory: 'Childhood friends turned soulmates! We grew up in the same neighborhood and destiny brought us back together after 15 years.',
      weddingDate: '2026-11-20',
      venue: 'Taj Lake Palace, Udaipur',
      description: 'A royal celebration of love by the lakeside. Join us for a magical weekend filled with traditional ceremonies and modern festivities.',
      coverImage: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800',
      createdBy: users[1].id,
      createdAt: new Date('2026-02-15').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Aditya Sharma',
      brideName: 'Isha Patel',
      coupleStory: 'From colleagues to life partners! Working late nights on projects turned into late night conversations, and here we are today.',
      weddingDate: '2026-10-10',
      venue: 'Hilton Garden, Bangalore',
      description: 'A modern celebration with a blend of both Punjabi and Gujarati traditions. Two cultures, one love story.',
      coverImage: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800',
      createdBy: users[2].id,
      createdAt: new Date('2026-03-10').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Kabir Mehta',
      brideName: 'Sanya Kapoor',
      coupleStory: 'A match made through family, blessed by destiny. What started as an arranged meeting blossomed into beautiful love.',
      weddingDate: '2027-01-25',
      venue: 'ITC Grand Bharat, Gurgaon',
      description: 'Traditional ceremonies with modern elegance. Join us for five days of celebrations filled with love, laughter, and blessings.',
      coverImage: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800',
      createdBy: users[3].id,
      createdAt: new Date('2026-04-05').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Arnav Malhotra',
      brideName: 'Kavya Reddy',
      coupleStory: 'Met at a destination wedding as strangers, became best friends, and now planning our own destination wedding!',
      weddingDate: '2026-09-18',
      venue: 'Alila Diwa, Goa',
      description: 'Beach vibes and wedding bells! A three-day celebration by the sea with sun, sand, and lots of dancing.',
      coverImage: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
      createdBy: users[4].id,
      createdAt: new Date('2026-03-20').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Varun Bajaj',
      brideName: 'Riya Singh',
      coupleStory: 'High school sweethearts who believed in forever. After 8 years together, we are finally saying "I do".',
      weddingDate: '2026-11-05',
      venue: 'The Oberoi Amarvilas, Agra',
      description: 'A fairy tale wedding with the Taj Mahal as our backdrop. Join us for an unforgettable celebration of eternal love.',
      coverImage: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
      createdBy: users[5].id,
      createdAt: new Date('2026-04-01').toISOString(),
    },
    {
      id: uuidv4(),
      groomName: 'Dev Khanna',
      brideName: 'Tara Bose',
      coupleStory: 'From dating app to altar! Swiped right and found my forever. Sometimes technology does bring soulmates together.',
      weddingDate: '2026-12-28',
      venue: 'JW Marriott, Kolkata',
      description: 'A grand Bengali-Punjabi fusion wedding. Experience the best of both cultures in a spectacular celebration.',
      coverImage: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
      createdBy: users[6].id,
      createdAt: new Date('2026-04-15').toISOString(),
    },
  ];

  // Generate dummy guests for each event (8-10 guests per event)
  const guests: Guest[] = [];
  const guestNames = [
    'Amit Kumar', 'Sneha Agarwal', 'Deepak Jain', 'Pooja Malhotra', 'Rajesh Iyer',
    'Anjali Desai', 'Sanjay Menon', 'Ritika Shah', 'Manish Gupta', 'Shreya Bhatia',
    'Nikhil Chopra', 'Priyanka Rao', 'Akash Pandey', 'Tanvi Kulkarni', 'Gaurav Saxena',
    'Megha Trivedi', 'Suresh Nambiar', 'Kavita Bansal', 'Vishal Arora', 'Simran Kohli',
    'Harish Pillai', 'Nisha Sinha', 'Abhishek Dutta', 'Swati Mishra', 'Rohit Sethi',
    'Aditi Ghosh', 'Manoj Thakur', 'Shweta Joshi', 'Pankaj Mehrotra', 'Ritu Bajpai',
  ];

  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Ahmedabad', 'Chandigarh'];
  const attendanceStatuses: Array<'Yes' | 'Maybe' | 'Cannot attend'> = ['Yes', 'Yes', 'Yes', 'Yes', 'Maybe', 'Maybe', 'Cannot attend'];
  const mealPreferences = ['Vegetarian', 'Non-Vegetarian', 'Jain', 'Vegan'];
  const travelModes = ['Flight', 'Train', 'Car', 'Bus'];

  events.forEach((event, eventIndex) => {
    const guestsForEvent = 8 + Math.floor(Math.random() * 3); // 8-10 guests per event
    
    for (let i = 0; i < guestsForEvent; i++) {
      const guestIndex = eventIndex * 10 + i;
      const attendanceStatus = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
      
      // Create function attendance based on overall status
      const functionAttendance: Record<string, 'Yes' | 'No'> = {
        'Welcome Lunch': attendanceStatus === 'Yes' ? (Math.random() > 0.3 ? 'Yes' : 'No') : 'No',
        'Mehendi': attendanceStatus === 'Yes' ? (Math.random() > 0.2 ? 'Yes' : 'No') : 'No',
        'Sangeet': attendanceStatus === 'Yes' ? (Math.random() > 0.1 ? 'Yes' : 'No') : 'No',
        'Haldi': attendanceStatus === 'Yes' ? (Math.random() > 0.3 ? 'Yes' : 'No') : 'No',
        'Wedding Ceremony': attendanceStatus === 'Yes' ? 'Yes' : 'No',
        'Reception': attendanceStatus === 'Yes' ? (Math.random() > 0.1 ? 'Yes' : 'No') : 'No',
        'Farewell Brunch': attendanceStatus === 'Yes' ? (Math.random() > 0.5 ? 'Yes' : 'No') : 'No',
      };

      const needsAccommodation = attendanceStatus === 'Yes' && Math.random() > 0.4;
      const needsTravel = attendanceStatus === 'Yes' && Math.random() > 0.5;

      guests.push({
        id: uuidv4(),
        eventId: event.id,
        name: guestNames[guestIndex % guestNames.length],
        mobile: `98765${43210 + guestIndex}`,
        email: `${guestNames[guestIndex % guestNames.length].toLowerCase().replace(' ', '.')}@email.com`,
        city: cities[Math.floor(Math.random() * cities.length)],
        respondingFor: ['Self', 'Couple', 'Family'][Math.floor(Math.random() * 3)] as any,
        attendanceStatus,
        functionAttendance,
        adults: attendanceStatus === 'Yes' ? 1 + Math.floor(Math.random() * 2) : 0,
        children: attendanceStatus === 'Yes' ? Math.floor(Math.random() * 3) : 0,
        infants: attendanceStatus === 'Yes' ? Math.floor(Math.random() * 2) : 0,
        additionalGuests: [],
        needsAccommodation,
        checkInDate: needsAccommodation ? new Date(new Date(event.weddingDate).getTime() - 86400000).toISOString().split('T')[0] : undefined,
        checkOutDate: needsAccommodation ? new Date(new Date(event.weddingDate).getTime() + 86400000).toISOString().split('T')[0] : undefined,
        numberOfRooms: needsAccommodation ? 1 + Math.floor(Math.random() * 2) : undefined,
        roomPreference: needsAccommodation ? ['Single', 'Double', 'Suite'][Math.floor(Math.random() * 3)] : undefined,
        arrivalMode: needsTravel ? travelModes[Math.floor(Math.random() * travelModes.length)] : undefined,
        arrivalDate: needsTravel ? new Date(new Date(event.weddingDate).getTime() - 86400000 * 2).toISOString().split('T')[0] : undefined,
        arrivalTime: needsTravel ? `${10 + Math.floor(Math.random() * 8)}:${['00', '30'][Math.floor(Math.random() * 2)]}` : undefined,
        departureDate: needsTravel ? new Date(new Date(event.weddingDate).getTime() + 86400000 * 2).toISOString().split('T')[0] : undefined,
        departureTime: needsTravel ? `${10 + Math.floor(Math.random() * 8)}:${['00', '30'][Math.floor(Math.random() * 2)]}` : undefined,
        needsPickup: needsTravel && Math.random() > 0.5,
        needsDrop: needsTravel && Math.random() > 0.5,
        transferPassengers: needsTravel ? 1 + Math.floor(Math.random() * 3) : 0,
        transferBags: needsTravel ? 1 + Math.floor(Math.random() * 4) : 0,
        mealPreference: mealPreferences[Math.floor(Math.random() * mealPreferences.length)],
        dietaryRestrictions: Math.random() > 0.7 ? 'No Onion, No Garlic' : '',
        specialAssistance: Math.random() > 0.8 ? ['Wheelchair Access'] : [],
        celebrationParticipation: attendanceStatus === 'Yes' && Math.random() > 0.6 ? ['Dance Performance', 'Speech'] : [],
        additionalNotes: Math.random() > 0.7 ? 'Looking forward to the celebration!' : '',
        infoAccurate: true,
        dataConsent: true,
        submittedAt: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString(),
        uploadSource: Math.random() > 0.7 ? 'BulkUpload' : 'RSVP',
      });
    }
  });

  // Generate dummy bulk messages
  const messages: BulkMessage[] = [];
  const functions = ['Welcome Lunch', 'Mehendi', 'Sangeet', 'Haldi', 'Wedding Ceremony', 'Reception', 'Farewell Brunch'];
  
  events.forEach((event, index) => {
    const messagesForEvent = 2 + Math.floor(Math.random() * 2); // 2-3 messages per event
    
    for (let i = 0; i < messagesForEvent; i++) {
      const selectedFunctions = [functions[Math.floor(Math.random() * functions.length)]];
      if (Math.random() > 0.5) {
        selectedFunctions.push(functions[Math.floor(Math.random() * functions.length)]);
      }

      const isSent = Math.random() > 0.4;
      const eventGuests = guests.filter(g => g.eventId === event.id);
      const recipients = eventGuests.filter(guest => 
        selectedFunctions.some(func => guest.functionAttendance[func] === 'Yes')
      );

      messages.push({
        id: uuidv4(),
        eventId: event.id,
        title: `${selectedFunctions[0]} Reminder`,
        content: `Dear Guest,\n\nThis is a gentle reminder about the upcoming ${selectedFunctions.join(' and ')} ceremony for ${event.groomName} & ${event.brideName}'s wedding.\n\nVenue: ${event.venue}\nDate: ${event.weddingDate}\n\nWe look forward to celebrating with you!\n\nWarm regards,\nThe ${event.groomName} & ${event.brideName} Family`,
        selectedFunctions,
        createdBy: event.createdBy,
        createdAt: new Date(Date.now() - Math.random() * 20 * 86400000).toISOString(),
        sentAt: isSent ? new Date(Date.now() - Math.random() * 10 * 86400000).toISOString() : undefined,
        totalRecipients: recipients.length,
        recipientGuestIds: isSent ? recipients.map(r => r.id) : undefined,
        isAutoSent: Math.random() > 0.7,
      });
    }
  });

  // Generate dummy uploaded guest lists
  const uploadedLists: UploadedGuestList[] = [];
  
  events.forEach((event, index) => {
    if (Math.random() > 0.5) { // 50% of events have uploaded lists
      const listsForEvent = 1 + Math.floor(Math.random() * 2); // 1-2 lists per event
      
      for (let i = 0; i < listsForEvent; i++) {
        const eventGuests = guests.filter(g => g.eventId === event.id && g.uploadSource === 'BulkUpload');
        
        uploadedLists.push({
          id: uuidv4(),
          eventId: event.id,
          fileName: `guest_list_${event.groomName.split(' ')[0]}_${i + 1}.xlsx`,
          uploadedAt: new Date(Date.now() - Math.random() * 15 * 86400000).toISOString(),
          processedGuests: eventGuests.length,
          messagesSent: Math.floor(eventGuests.length * 0.8),
          guestData: eventGuests.slice(0, 5).map(guest => {
            const attendingEvents = Object.entries(guest.functionAttendance)
              .filter(([_, attending]) => attending === 'Yes')
              .map(([event]) => event);
            
            return {
              guestName: guest.name,
              email: guest.email,
              mobile: guest.mobile,
              attendingEvents,
              guestId: guest.id,
            };
          }),
          createdBy: event.createdBy,
        });
      }
    }
  });

  // Save all data to localStorage
  localStorage.setItem('wedding_users', JSON.stringify(users));
  localStorage.setItem('wedding_events', JSON.stringify(events));
  localStorage.setItem('wedding_guests', JSON.stringify(guests));
  localStorage.setItem('wedding_messages', JSON.stringify(messages));
  localStorage.setItem('wedding_uploaded_guest_lists', JSON.stringify(uploadedLists));

  console.log('✅ Dummy data seeded successfully!');
  console.log(`📊 Summary:
  - ${users.length} users
  - ${events.length} wedding events
  - ${guests.length} guests
  - ${messages.length} bulk messages
  - ${uploadedLists.length} uploaded guest lists
  `);

  return {
    users,
    events,
    guests,
    messages,
    uploadedLists,
  };
}

// Clear all data
export function clearAllData() {
  localStorage.removeItem('wedding_users');
  localStorage.removeItem('wedding_events');
  localStorage.removeItem('wedding_guests');
  localStorage.removeItem('wedding_messages');
  localStorage.removeItem('wedding_uploaded_guest_lists');
  console.log('🗑️ All data cleared!');
}
