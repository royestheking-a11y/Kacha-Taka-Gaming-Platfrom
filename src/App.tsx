import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { CrashGame } from './components/games/CrashGame';
import { MinesGame } from './components/games/MinesGame';
import { SlotsGame } from './components/games/SlotsGame';
import { DiceGame } from './components/games/DiceGame';
import { Profile } from './components/Profile';
import { Wallet } from './components/Wallet';
import { Messages } from './components/Messages';
import { AdminPanel } from './components/admin/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { PolicyPage } from './components/PolicyPage';
import { Footer } from './components/Footer';
import { Fairness } from './components/Fairness';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { UserProvider, useUser } from './contexts/UserContext';
import { Toaster } from './components/ui/sonner';

// Export User type for backward compatibility
export type { User } from './contexts/UserContext';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);

  return null;
}

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/fairness" element={
          <>
            <Navbar />
            <div className="pt-16">
              <Fairness />
            </div>
            <Footer />
          </>
        } />
        <Route path="/terms" element={
          <>
            <Navbar />
            <div className="pt-16">
              <PolicyPage type="terms" />
            </div>
            <Footer />
          </>
        } />
        <Route path="/privacy" element={
          <>
            <Navbar />
            <div className="pt-16">
              <PolicyPage type="privacy" />
            </div>
            <Footer />
          </>
        } />
        <Route path="/responsible" element={
          <>
            <Navbar />
            <div className="pt-16">
              <PolicyPage type="responsible" />
            </div>
            <Footer />
          </>
        } />

        {/* Auth Routes */}
        <Route path="/login" element={<Auth defaultTab="login" />} />
        <Route path="/register" element={<Auth defaultTab="register" />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Protected Game Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <Dashboard />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/crash" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <CrashGame />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/mines" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <MinesGame />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/slots" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <SlotsGame />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/dice" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <DiceGame />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <Profile />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/wallet" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <Wallet />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />
        <Route path="/messages" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <Messages />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <>
              <Navbar />
              <div className="pt-16 min-h-[calc(100vh-300px)]">
                <AdminPanel />
              </div>
              <Footer />
            </>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <UserProvider>
      <div className="min-h-screen bg-neutral-50">
        <AppRoutes />
        <Toaster />
      </div>
    </UserProvider>
  );
}
