import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <p className="font-headline italic text-2xl text-primary animate-pulse">
          Paradies <span className="text-primary/50">✦</span>
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}