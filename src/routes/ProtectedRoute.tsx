// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export function ProtectedRoute() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkMe() {
      if (!isLoaded) return;
      if (!isSignedIn) {
        if (!cancelled) setChecking(false);
        return;
      }

      // `/onboarding` nechceme blokovat
      if (location.pathname === "/onboarding") {
        if (!cancelled) setChecking(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        if (!cancelled) setChecking(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cancelled) return;

      if (res.status === 404) {
        setNeedsOnboarding(true);
      } else {
        setNeedsOnboarding(false);
      }

      setChecking(false);
    }

    checkMe();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, location.pathname]);

  if (!isLoaded || checking) {
    return <div className="p-6 text-slate-400">Nacítám…</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
