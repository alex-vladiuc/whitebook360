import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

const SIDEBAR_COLLAPSE_KEY = "tt_sidebar_collapsed";

export function MainLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(SIDEBAR_COLLAPSE_KEY);
        if (saved === "1") setCollapsed(true);
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((v) => {
            const next = !v;
            localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
            return next;
        });
    };

    // main left margin based on sidebar state (desktop)
    const desktopOffsetClass = useMemo(
        () => (collapsed ? "md:ml-[72px]" : "md:ml-[240px]"),
        [collapsed]
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop sidebar */}
            <div className="hidden md:block">
                <AppSidebar
                    collapsed={collapsed}
                    onToggleCollapsed={toggleCollapsed}
                    mobileOpen={false}
                    onMobileOpenChange={() => {}}
                />
            </div>

            {/* Mobile overlay sidebar */}
            <div className="md:hidden">
                <AppSidebar
                    collapsed={false}
                    onToggleCollapsed={() => {}}
                    mobileOpen={mobileOpen}
                    onMobileOpenChange={setMobileOpen}
                />
            </div>

            {/* Top-left hamburger for mobile */}
            <button
                className="md:hidden fixed top-4 left-4 z-50 rounded-lg border bg-card px-3 py-2 shadow-card"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="h-5 w-5" />
            </button>

            {/* Main */}
            <main className={cn("min-h-screen", desktopOffsetClass)}>
                {/* Centered container like Base44 */}
                <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
