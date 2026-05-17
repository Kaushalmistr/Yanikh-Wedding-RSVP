# Dummy Data Guide

## 🚀 Project Running

The project is now running at: **http://localhost:5174/**

## 🌱 How to Add Dummy Data

1. Open the application in your browser at http://localhost:5174/
2. **Login/Register** with any credentials (the app uses localStorage)
   - Example: Mobile: `9876543210`, OTP: any 4 digits
3. Once logged in, you'll see the **Dashboard**
4. Click the **"Seed Data"** button (green button with database icon) in the top right
5. Confirm the action
6. **Done!** Your app now has dummy data for all modules

## 📊 What Dummy Data is Added

### 👥 **Users** (8 users)
- Priya Sharma (9876543210)
- Rahul Verma (9876543211)
- Ananya Patel (9876543212)
- Vikram Singh (9876543213)
- Neha Kapoor (9876543214)
- Arjun Reddy (9876543215)
- Divya Nair (9876543216)
- Karan Malhotra (9876543217)

### 💒 **Wedding Events** (7 events)
1. **Yuvraj Khanna & Nanki Sharma** - Dec 15, 2026 @ The Grand Palace, Delhi
2. **Rohan Gupta & Meera Joshi** - Nov 20, 2026 @ Taj Lake Palace, Udaipur
3. **Aditya Sharma & Isha Patel** - Oct 10, 2026 @ Hilton Garden, Bangalore
4. **Kabir Mehta & Sanya Kapoor** - Jan 25, 2027 @ ITC Grand Bharat, Gurgaon
5. **Arnav Malhotra & Kavya Reddy** - Sep 18, 2026 @ Alila Diwa, Goa
6. **Varun Bajaj & Riya Singh** - Nov 5, 2026 @ The Oberoi Amarvilas, Agra
7. **Dev Khanna & Tara Bose** - Dec 28, 2026 @ JW Marriott, Kolkata

### 👨‍👩‍👧‍👦 **Guests** (60+ guests)
- 8-10 guests per event
- Varied attendance status: "Yes", "Maybe", "Cannot attend"
- Mix of RSVP sources: Direct RSVP form and Bulk Upload
- Different meal preferences: Vegetarian, Non-Vegetarian, Jain, Vegan
- Various accommodation needs
- Travel details for some guests
- Special assistance requirements
- Function-specific attendance (Mehendi, Sangeet, Haldi, etc.)

### 📧 **Bulk Messages** (15+ messages)
- 2-3 messages per event
- Different function selections
- Mix of sent and draft messages
- Auto-sent and manually created messages
- Targeted to specific event functions

### 📋 **Uploaded Guest Lists** (5+ lists)
- Excel/CSV upload history
- Associated with various events
- Processing statistics
- Message sending history

## 📱 Modules to Explore

### 1. **Dashboard** (`/dashboard`)
- View all events
- Global statistics
- Search functionality
- Create new events

### 2. **Create Event** (`/create-event`)
- Create new wedding events
- Add couple details, venue, date
- Upload cover images

### 3. **Event Details** (`/event/:id`)
- View specific event information
- See guest list overview
- RSVP statistics
- Quick actions

### 4. **Guest List** (`/guests/:id`)
- Complete guest list table
- Filter and search guests
- Export to Excel
- Upload bulk guest lists
- View attendance by function

### 5. **RSVP Form** (`/rsvp/:id`)
- Multi-step guest RSVP form
- Personal details
- Attendance confirmation
- Function selection
- Accommodation requests
- Travel details
- Meal preferences
- Special assistance

### 6. **Bulk Messaging** (`/messaging/:id`)
- Create targeted messages
- Select specific functions
- Preview recipients
- Send bulk communications
- View message history

## 🧹 Reset Data

If you want to start fresh:
1. Click the **"Reset"** button (orange button) in the Dashboard
2. This will clear all data from localStorage
3. Page will reload automatically

## 💡 Tips

- The app uses **localStorage** for data persistence
- Data is stored in your browser (no backend required)
- Dummy data includes realistic Indian names, cities, and scenarios
- Each event has varied guest responses for realistic testing
- Messages are targeted based on function attendance
- Some guests have accommodation/travel needs
- Explore different modules to see all features

## 🛠️ Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

**Enjoy testing the Wedding RSVP Management System! 🎉💒**
