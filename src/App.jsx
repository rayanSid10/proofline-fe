import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppRoutes } from '@/routes';

const queryClient = new QueryClient();

function App() {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('investigator');

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentRole(userData.role);
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentRole('investigator');
  };

  const handleRoleChange = (role) => {
    setCurrentRole(role);
    if (user) {
      setUser({ ...user, role });
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
