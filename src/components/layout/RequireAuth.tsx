import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, loading } = useAuthContext();
    const location = useLocation();

    if (loading) return null;

    // 1. Not logged in → auth
    if (!isAuthenticated) {
        return <Navigate to="/auth" replace state={{ from: location }} />;
    }

    // 2. Fully allowed
    return <>{children}</>;
}
