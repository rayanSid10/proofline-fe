import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/auth/LoginPage';
import EnhancedDashboardPage from '@/pages/dashboard/EnhancedDashboardPage';
import AccessDenied from '@/components/shared/AccessDenied';
import ComingSoon from '@/components/shared/ComingSoon';
import CaseListPage from '@/pages/cases/CaseListPage';
import CaseDetailPage from '@/pages/cases/CaseDetailPage';
import CreateCasePage from '@/pages/cases/CreateCasePage';
import InvestigationFormPage from '@/pages/cases/InvestigationFormPage';
import InvestigationReviewPage from '@/pages/cases/InvestigationReviewPage';
import SupervisorInvestigationReportPage from '@/pages/cases/SupervisorInvestigationReportPage';
import SupervisorReviewPage from '@/pages/cases/SupervisorReviewPage';
import ReportViewPage from '@/pages/cases/ReportViewPage';
import FTDHInwardPage from '@/pages/ftdh/FTDHInwardPage';
import FTDHOutwardPage from '@/pages/ftdh/FTDHOutwardPage';
import FTDHOutwardDetailPage from '@/pages/ftdh/FTDHOutwardDetailPage';
import FTDHDetailPage from '@/pages/ftdh/FTDHDetailPage';
import FTDHBranchPage from '@/pages/ftdh/FTDHBranchPage';
import FTDHBranchDetailPage from '@/pages/ftdh/FTDHBranchDetailPage';
import {
  canAccessIBMB,
  canAccessFTDH,
  isBranchUser,
  canApprove,
  canAccessDashboard,
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

// Placeholder removed - using ComingSoon component instead

// Helper to get default route based on role
function getDefaultRoute(role) {
  switch (role) {
    case 'supervisor':
      return '/dashboard';
    case 'investigator':
      return '/cases';
    case 'ftdh_officer':
      return '/ftdh';
    case 'branch_user':
      return '/ftdh/branch';
    default:
      return '/dashboard';
  }
}

export function AppRoutes({ user, onLogin, onLogout }) {
  const currentRole = user?.role;
  const defaultRoute = getDefaultRoute(currentRole);

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
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        {/* Dashboard — supervisor only */}
        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route
          path="/dashboard"
          element={
            canAccessDashboard(currentRole) ? (
              <EnhancedDashboardPage currentRole={currentRole} />
            ) : (
              <AccessDenied />
            )
          }
        />

        {/* IB/MB Cases — investigator, supervisor */}
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
        <Route path="/cases/:id/edit" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <CreateCasePage />
          </PermissionGuard>
        } />
        <Route path="/cases/:id" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <CaseDetailPage currentRole={currentRole} currentUser={user} />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/investigation" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <InvestigationFormPage currentRole={currentRole} currentUser={user} />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/investigation-review" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <InvestigationReviewPage currentRole={currentRole} currentUser={user} />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/supervisor-report" element={
          <PermissionGuard allowed={canApprove(currentRole)}>
            <SupervisorInvestigationReportPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/cases/:id/investigate" element={
          <PermissionGuard allowed={canAccessIBMB(currentRole)}>
            <InvestigationFormPage currentRole={currentRole} currentUser={user} />
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

        {/* FTDH — ftdh_officer, supervisor */}
        <Route path="/ftdh" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <FTDHInwardPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/ftdh/outward" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <FTDHOutwardPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/ftdh/outward/:id" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <FTDHOutwardDetailPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/ftdh/branch" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole) || isBranchUser(currentRole)}>
            <FTDHBranchPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/ftdh-branch/:id" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole) || isBranchUser(currentRole)}>
            <FTDHBranchDetailPage currentRole={currentRole} />
          </PermissionGuard>
        } />
        <Route path="/ftdh/:id" element={
          <PermissionGuard allowed={canAccessFTDH(currentRole)}>
            <FTDHDetailPage currentRole={currentRole} />
          </PermissionGuard>
        } />

        {/* Coming Soon Pages */}
        <Route path="/reports" element={<ComingSoon feature="Reports" />} />
        <Route path="/dispute-resolution" element={<ComingSoon feature="Dispute Resolution" />} />
        <Route path="/application-level" element={<ComingSoon feature="Application Level" />} />
        <Route path="/merchant-acquiring" element={<ComingSoon feature="Merchant Acquiring" />} />
        <Route path="/wallets-dispute" element={<ComingSoon feature="Wallets Dispute" />} />
        <Route path="/credit-card-dispute" element={<ComingSoon feature="Credit Card Dispute" />} />
        <Route path="/debit-card-dispute" element={<ComingSoon feature="Debit Card Dispute" />} />
        <Route path="/settings" element={<ComingSoon feature="Settings" />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
