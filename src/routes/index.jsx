import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import CaseListPage from '@/pages/cases/CaseListPage';
import CaseDetailPage from '@/pages/cases/CaseDetailPage';
import CreateCasePage from '@/pages/cases/CreateCasePage';
import InvestigationPage from '@/pages/cases/InvestigationPage';
import SupervisorReviewPage from '@/pages/cases/SupervisorReviewPage';
import ReportViewPage from '@/pages/cases/ReportViewPage';
import {
  canAccessIBMB,
  canAccessFTDH,
  isBranchUser,
  isAdmin,
} from '@/utils/permissions';

/**
 * Wraps a route element with a permission check.
 * If the check fails, redirects to /dashboard.
 */
function PermissionGuard({ allowed, children }) {
  if (!allowed) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-2">Coming soon...</p>
      </div>
    </div>
  );
}

export function AppRoutes({ user, onLogin, onLogout, onRoleChange, currentRole }) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage onLogin={onLogin} />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          user ? (
            <MainLayout
              user={user}
              onLogout={onLogout}
              onRoleChange={onRoleChange}
              currentRole={currentRole}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {/* Dashboard — all roles */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage currentRole={currentRole} />} />

        {/* IB/MB Cases — investigator, supervisor, admin */}
        <Route path="/cases" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <CaseListPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/cases/create" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <CreateCasePage />
          </PermissionGuard>
        } />
        <Route path="/cases/:id" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <CaseDetailPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/investigation" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <InvestigationPage />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/review" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <SupervisorReviewPage />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/report" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <ReportViewPage />
          </PermissionGuard>
        } />

        {/* FTDH — ftdh_officer, admin */}
        <Route path="/ftdh" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <PlaceholderPage title="FTDH Inbox" />
          </PermissionGuard>
        } />
        <Route path="/ftdh/outward" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <PlaceholderPage title="Outward FTDH" />
          </PermissionGuard>
        } />
        <Route path="/ftdh/branch" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole) || isBranchUser(currentRole)}>
            <PlaceholderPage title="Branch Portal" />
          </PermissionGuard>
        } />
        <Route path="/ftdh/:id" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <PlaceholderPage title="FTDH Details" />
          </PermissionGuard>
        } />

        {/* Admin */}
        <Route path="/users" element={
          <PermissionGuard allowed={isAdmin(currentRole)}>
            <PlaceholderPage title="User Management" />
          </PermissionGuard>
        } />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
