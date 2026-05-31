import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import GuestList from './pages/GuestList';
import RSVPForm from './pages/RSVPForm';
import BulkMessaging from './pages/BulkMessaging';
import { type ReactNode } from 'react';
import './utils/storageDebug'; // Load storage debugging tools

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
}

function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <AuthPage />
          </PublicRoute>
        }
      />
      {/* Guest RSVP route - must come BEFORE /rsvp/:id to match correctly */}
      <Route
        path="/rsvp/guest/:token"
        element={
          <RSVPForm />
        }
      />
      <Route
        path="/rsvp/:id"
        element={
          <ProtectedRoute>
            <RSVPForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id"
        element={
          <ProtectedRoute>
            <EventDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guests/:id"
        element={
          <ProtectedRoute>
            <GuestList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messaging/:id"
        element={
          <ProtectedRoute>
            <BulkMessaging />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
}
