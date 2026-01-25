import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Clock,
  FileText,
  Calendar,
  ClipboardList,
  LogOut,
  Briefcase,
  Shield,
  Building2,
  ClipboardCheck,
  DoorOpen,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthContext } from "@/contexts/AuthContext";

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileOpenChange: (v: boolean) => void;
};

type NavItem = { label: string; href: string; icon: any };

const generalItems: NavItem[] = [
  { label: "My Space", href: "/", icon: User },
  { label: "Leave Calendar", href: "/leave-calendar", icon: Calendar },
  { label: "Kiosk Mode", href: "/kiosk", icon: Clock },
];

const adminItems: NavItem[] = [
  { label: "User Management", href: "/admin/user-management", icon: Users },
  { label: "Admin Dashboard", href: "/admin/dashboard", icon: LayoutGrid },
  { label: "Admin Hours API", href: "/admin/admin-hours", icon: Shield },
  { label: "Invoice Management", href: "/admin/invoice-management", icon: FileText },
  { label: "Admin Invoices", href: "/admin/admin-invoices", icon: Building2 },
  { label: "Global Archive", href: "/admin/global-archive", icon: Archive },
  { label: "Project Calendar", href: "/admin/project-calendar", icon: Calendar },
  { label: "Task Calendar", href: "/admin/task-calendar", icon: ClipboardList },
  { label: "Visitor Log", href: "/visitor-log", icon: ClipboardCheck },
  { label: "Employee Management", href: "/admin/employee-management", icon: Briefcase },
  { label: "See Ya Later", href: "/see-ya-later", icon: DoorOpen },
];

function NavSection({
                      title,
                      items,
                      collapsed,
                    }: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  const location = useLocation();

  return (
      <div className="space-y-2">
        {!collapsed && (
            <div className="px-3 text-[11px] font-semibold tracking-wider text-muted-foreground">
              {title.toUpperCase()}
            </div>
        )}

        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
                <Link
                    key={item.href}
                    to={item.href}
                    className={cn(isActive ? "nav-item-active" : "nav-item", collapsed && "justify-center")}
                    title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Link>
            );
          })}
        </nav>
      </div>
  );
}

export function AppSidebar({
                             collapsed,
                             onToggleCollapsed,
                             mobileOpen,
                             onMobileOpenChange,
                           }: SidebarProps) {
  const { profile, user, signOut } = useAuthContext();
  const isAdmin = profile?.role === "admin";

  const initials = (profile?.full_name || user?.email || "U")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("");

  // Desktop vs mobile behavior:
  // - Desktop: fixed sidebar, can collapse to icons only.
  // - Mobile: overlay drawer, no collapse toggle (always full).
  const isMobileDrawer = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(max-width: 767px)").matches;

  const widthClass = collapsed ? "w-[72px]" : "w-[240px]";

  const desktopAside = (
      <aside
          className={cn(
              "fixed left-0 top-0 z-40 h-screen bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]",
              widthClass
          )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-4">
            {!collapsed ? (
                <div>
                  <div className="text-sm font-semibold text-foreground">WhiteBook 360</div>
                  <div className="text-xs text-muted-foreground">Inspiration360</div>
                </div>
            ) : (
                <div className="text-sm font-semibold text-foreground">WB</div>
            )}

            <button
                onClick={onToggleCollapsed}
                className="rounded-md p-2 hover:bg-muted transition-colors"
                aria-label="Toggle sidebar"
                title="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>

          {/* Nav */}
          <div className="flex-1 space-y-6 px-2 py-2 overflow-y-auto">
            <NavSection title="General" items={generalItems} collapsed={collapsed} />
            {isAdmin && (
                <div className="pt-2">
                  {!collapsed && <div className="mx-3 my-2 h-px bg-border" />}
                  <NavSection title="Administration" items={adminItems} collapsed={collapsed} />
                </div>
            )}
          </div>

          {/* Footer user pill */}
          <div className="border-t border-border p-3">
            <div className={cn("flex items-center gap-3 rounded-xl bg-muted/40 p-2", collapsed && "justify-center")}>
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
              </Avatar>

              {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">{profile?.full_name || user?.email}</div>
                      <div className="text-xs text-muted-foreground capitalize">{profile?.role || "user"}</div>
                    </div>

                    <button
                        onClick={() => signOut()}
                        className="rounded-md p-2 hover:bg-muted transition-colors"
                        title="Sign out"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </>
              )}
            </div>
          </div>
        </div>
      </aside>
  );

  const mobileDrawer = (
      <div className={cn("fixed inset-0 z-50", mobileOpen ? "block" : "hidden")}>
        <div className="absolute inset-0 bg-black/40" onClick={() => onMobileOpenChange(false)} />
        <aside className="absolute left-0 top-0 h-full w-[280px] bg-card border-r shadow-modal flex flex-col">
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div>
              <div className="text-sm font-semibold">WhiteBook 360</div>
              <div className="text-xs text-muted-foreground">Menu</div>
            </div>
            <button
                className="rounded-md p-2 hover:bg-muted"
                onClick={() => onMobileOpenChange(false)}
                aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
            <NavSection title="General" items={generalItems} collapsed={false} />
            {isAdmin && (
                <>
                  <div className="h-px bg-border" />
                  <NavSection title="Administration" items={adminItems} collapsed={false} />
                </>
            )}
          </div>

          {/* Footer user pill with logout for mobile */}
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{initials}</AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate">{profile?.full_name || user?.email}</div>
                <div className="text-xs text-muted-foreground capitalize">{profile?.role || "user"}</div>
              </div>

              <button
                  onClick={() => {
                    signOut();
                    onMobileOpenChange(false);
                  }}
                  className="rounded-md p-2 hover:bg-muted transition-colors"
                  title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>
  );

  return (
      <>
        {/* Desktop */}
        <div className="hidden md:block">{desktopAside}</div>
        {/* Mobile */}
        <div className="md:hidden">{mobileDrawer}</div>
      </>
  );
}
