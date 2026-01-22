import { Navigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

export default function RequireAdmin({ children }: { children: React.ReactNode }) {
    const { loading, profile } = useAuthContext();

    if (loading) return null;

    if (profile?.role !== "admin") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}
