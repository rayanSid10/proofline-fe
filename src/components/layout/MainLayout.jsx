import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function MainLayout({ user, onLogout, onRoleChange, currentRole }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar currentRole={currentRole} onLogout={onLogout} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          onLogout={onLogout}
          onRoleChange={onRoleChange}
          currentRole={currentRole}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;

