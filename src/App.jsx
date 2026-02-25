import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes';

const queryClient = new QueryClient();
const AUTH_USER_KEY = 'proofline.auth.user';

function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function App() {
  const [user, setUser] = useState(() => getStoredUser());
  const [currentRole, setCurrentRole] = useState(() => getStoredUser()?.role || 'investigator');

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentRole(userData.role);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    } catch {
      // ignore storage failures in demo mode
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRole('investigator');
    try {
      localStorage.removeItem(AUTH_USER_KEY);
    } catch {
      // ignore storage failures in demo mode
    }
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      try {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      } catch {
        // ignore storage failures in demo mode
      }
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onRoleChange={handleRoleChange}
          currentRole={currentRole}
        />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
