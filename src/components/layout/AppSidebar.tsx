import { useLocation, Link } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Clock,
  FileText,
  Calendar,
  ClipboardList,
  LogOut,
  Briefcase,
  Settings,
  HandMetal,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const generalItems: NavItem[] = [
  { label: 'Kiosk', href: '/kiosk', icon: LayoutGrid },
  { label: 'Leave Calendar', href: '/leave-calendar', icon: Calendar },
  { label: 'Visitor Log', href: '/visitor-log', icon: ClipboardList },
];

const adminItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutGrid },
  { label: 'User Management', href: '/admin/user-management', icon: Users },
  { label: 'Employee Management', href: '/admin/employee-management', icon: Briefcase },
  { label: 'Admin Hours', href: '/admin/admin-hours', icon: Clock },
  { label: 'Invoice Management', href: '/admin/invoice-management', icon: FileText },
  { label: 'Project Calendar', href: '/admin/project-calendar', icon: Calendar },
  { label: 'See Ya Later', href: '/see-ya-later', icon: HandMetal },
];

function NavSection({ title, items }: { title: string; items: NavItem[] }) {
  const location = useLocation();

  return (
    <div className="mb-6">
      <h3 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                isActive ? 'nav-item-active' : 'nav-item'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function AppSidebar() {
  const { profile, signOut, user } = useAuthContext();
  const isAdmin = profile?.role === 'admin';

  const handleSignOut = async () => {
    await signOut();
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Logo / Brand */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Clock className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground">TimeTracker Pro</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        <NavSection title="General" items={generalItems} />
        {isAdmin && <NavSection title="Administration" items={adminItems} />}
      </div>

      {/* User Pill */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="user-pill">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role || 'User'}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
