import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Smartphone,
  Wallet,
  Building2,
  AppWindow,
  Scale,
  Clock,
  BarChart3,
  Users,
  LogOut,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  canAccessIBMB,
  canAccessFTDH,
  isBranchUser,
  isAdmin,
} from '@/utils/permissions';

/**
 * Build the visible menu items based on the current user's role.
 * Each item is a FLAT link — no children, matching the Figma sidebar.
 */
function getMenuItems(role) {
  const items = [];

  items.push({
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  });

  if (canAccessIBMB(role)) {
    items.push({
      title: 'IB/MB Dispute',
      icon: FileText,
      path: '/cases',
    });
  }

  // Placeholder items matching Figma sidebar
  items.push({
    title: 'Credit Card Dispute',
    icon: CreditCard,
    path: '/credit-card',
  });

  items.push({
    title: 'Debit Card Dispute',
    icon: Smartphone,
    path: '/debit-card',
  });

  items.push({
    title: 'Wallets Dispute',
    icon: Wallet,
    path: '/wallets',
  });

  items.push({
    title: 'Merchant Acquiring',
    icon: Building2,
    path: '/merchant',
  });

  items.push({
    title: 'Application Level',
    icon: AppWindow,
    path: '/application',
  });

  items.push({
    title: 'Dispute Resolution',
    icon: Scale,
    path: '/resolution',
  });

  if (canAccessFTDH(role)) {
    items.push({
      title: 'FTDH',
      icon: Clock,
      path: '/ftdh',
      badge: '10 New',
    });
  }

  if (isBranchUser(role)) {
    items.push({
      title: 'FTDH Branch',
      icon: Building2,
      path: '/ftdh/branch',
    });
  }

  items.push({
    title: 'Reports',
    icon: BarChart3,
    path: '/reports',
  });

  if (isAdmin(role)) {
    items.push({
      title: 'User Management',
      icon: Users,
      path: '/users',
    });
  }

  return items;
}

function NavItem({ item, collapsed }) {
  const location = useLocation();
  const isActive =
    location.pathname === item.path ||
    (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

  return (
    <NavLink
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        'text-white/70 hover:text-white hover:bg-white/10',
        isActive && 'bg-white/15 text-white shadow-sm'
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && (
        <span className="flex-1 text-left truncate">{item.title}</span>
      )}
      {!collapsed && item.badge && (
        <span className="ml-auto text-[10px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function SidebarContent({ collapsed = false, currentRole, onLogout }) {
  const menuItems = getMenuItems(currentRole);

  return (
    <div className="flex h-full flex-col bg-[#2064B7]">
      {/* Logo */}
      <div className="flex h-16 items-center px-4 border-b border-white/10">
        <span
          className={cn(
            'font-bold text-xl text-white tracking-wide',
            collapsed && 'sr-only'
          )}
        >
          ProofLine
        </span>
        {collapsed && (
          <span className="font-bold text-xl text-white">PL</span>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-0.5 px-3 py-4 overflow-y-auto">
        {menuItems.map((item) => (
          <NavItem key={item.path} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Footer Section */}
      <div className="px-3 py-4 border-t border-white/10">
        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              'text-white/70 hover:text-white hover:bg-white/10'
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        )}
      </div>

      {/* Copyright */}
      {!collapsed && (
        <div className="px-4 pb-3 text-[10px] text-white/40 text-center">
          © 2025, Made by ProofLine
        </div>
      )}
    </div>
  );
}

export function Sidebar({ currentRole, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-40"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent currentRole={currentRole} onLogout={onLogout} />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col transition-all duration-300',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          currentRole={currentRole}
          onLogout={onLogout}
        />
      </aside>
    </>
  );
}

export default Sidebar;
