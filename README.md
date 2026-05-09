# Wedding RSVP Website

A modern web application for managing wedding events and guest RSVPs. Built with React, TypeScript, Vite, and Tailwind CSS.

## Features

- **Event Management**: Create and manage multiple wedding events
- **Guest RSVP Tracking**: Easy-to-use RSVP form for guests
- **Authentication**: Secure login system for event organizers
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Data Export**: Export guest information in Excel format

## Tech Stack

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 4
- **Routing**: React Router DOM 7
- **Icons**: Lucide React
- **Utilities**: UUID, clsx, tailwind-merge
- **Export**: XLSX

## Project Structure

```
├── src/
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx               # Entry point
│   ├── index.css              # Global styles
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication context provider
│   ├── lib/
│   │   ├── constants.ts       # App constants
│   │   └── db.ts             # Database/storage utilities
│   ├── pages/
│   │   ├── AuthPage.tsx       # Login/registration page
│   │   ├── Dashboard.tsx      # Event list and overview
│   │   ├── CreateEvent.tsx    # Create new event form
│   │   ├── EventDetail.tsx    # Event details and guest list
│   │   └── RSVPForm.tsx       # Guest RSVP submission form
│   └── utils/
│       └── cn.ts             # Utility functions (classname merger)
├── public/
│   └── images/               # Static images
├── index.html                # HTML template
├── package.json              # Project dependencies
├── tsconfig.json             # TypeScript configuration
└── vite.config.ts            # Vite configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wedding-rsvp-website-development
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Usage

### For Event Organizers

1. **Login**: Access the application and authenticate
2. **Create Event**: Click "Create Event" to set up a new wedding event
3. **Share RSVP Link**: Share the event link with guests
4. **Track RSVPs**: Monitor guest responses in real-time
5. **Export Data**: Export guest list to Excel

### For Guests

1. **Access RSVP Form**: Open the shared event link
2. **Submit Response**: Fill out the RSVP form with your details
3. **Confirmation**: Receive confirmation of your RSVP

## Authentication

The application uses a context-based authentication system (`AuthContext`) to manage user sessions. Event organizers must authenticate before accessing the dashboard and managing events.

## Development

### Component Structure

- **Pages**: Top-level page components for each route
- **Context**: Global state management for authentication
- **Utils**: Helper functions and utilities
- **Lib**: Core application logic and constants

### Styling

The project uses Tailwind CSS for styling with custom utilities defined in `cn.ts` for conditional class merging.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `dist` directory. The application is configured to work as a single-file build for easy deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary and intended for personal use.

## Support

For issues or questions, please contact the development team.
