import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading, needsPin, profile } = useAuthContext();
    const location = useLocation();

    if (loading) return null;

    // 1. Not logged in → auth
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    // 2. Profile not loaded yet - show loading or let them through
    //    (This handles RLS issues or slow network)
    if (profile === null) {
        // Profile couldn't be fetched - might be RLS issue
        // For now, show a loading state rather than redirecting
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-muted-foreground">Loading profile...</p>
            </div>
        );
    }

    // 3. Logged in but NOT approved → waiting screen
    if (profile.approval_status !== "approved") {
        return <Navigate to="/pending-approval" replace />;
    }

    // 4. Approved but no PIN → set PIN
    if (needsPin && location.pathname !== "/set-pin") {
        return <Navigate to="/set-pin" replace />;
    }

    // 5. Fully allowed
    return <>{children}</>;
}
