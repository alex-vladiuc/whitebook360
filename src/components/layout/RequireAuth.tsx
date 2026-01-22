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

    // 2. Logged in but NOT approved → waiting screen
    if (profile?.approval_status !== "approved") {
        return <Navigate to="/pending-approval" replace />;
    }

    // 3. Approved but no PIN → set PIN
    if (needsPin && location.pathname !== "/set-pin") {
        return <Navigate to="/set-pin" replace />;
    }

    // 4. Fully allowed
    return <>{children}</>;
}
