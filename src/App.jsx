import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes';
import { authAPI } from '@/api/auth';

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
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem('token'));

  // On mount, validate token by calling /auth/me/
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    authAPI.me()
      .then(({ data }) => {
        const normalizedUser = {
          ...data,
          role: data.role.toLowerCase(),
          name: data.full_name,
        };
        setUser(normalizedUser);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
      })
      .catch(() => {
        // Token invalid/expired and refresh failed — clear everything
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        localStorage.removeItem(AUTH_USER_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
    } catch {
      // ignore storage failures
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
    } catch {
      // ignore storage failures
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes
          user={user}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
