import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import CoachDashboard from './pages/CoachDashboard';
import Clients from './pages/Clients';
import CheckIns from './pages/CheckIns';
import ClientHome from './pages/ClientHome';
import ClientCheckIn from './pages/ClientCheckIn';
import ClientOnboarding from './pages/ClientOnboarding';
import MyCheckIns from './pages/MyCheckIns';
import ParticipantWelcome from './pages/ParticipantWelcome';
import ClientDetail from './pages/ClientDetail';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/SignIn" element={<SignIn />} />
      <Route path="/ClientOnboarding" element={<ClientOnboarding />} />
      <Route path="/participant-welcome" element={<ParticipantWelcome />} />

      {/* Coach pages with layout */}
      <Route element={<Layout />}>
        <Route path="/ClientDetail" element={<ClientDetail />} />
        <Route path="/Dashboard" element={<CoachDashboard />} />
        <Route path="/Clients" element={<Clients />} />
        <Route path="/CheckIns" element={<CheckIns />} />
      </Route>

      {/* Client pages with layout */}
      <Route element={<Layout />}>
        <Route path="/ClientHome" element={<ClientHome />} />
        <Route path="/ClientCheckIn" element={<ClientCheckIn />} />
        <Route path="/MyCheckIns" element={<MyCheckIns />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App