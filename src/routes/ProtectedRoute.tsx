import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

export function ProtectedRoute() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [allow, setAllow] = useState(false);
  const [redirectToOnboarding, setRedirectToOnboarding] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setAllow(false);
        setChecking(false);
        return;
      }

      // ? onboarding je vždy povolen
      if (location.pathname === "/onboarding") {
        setAllow(true);
        setChecking(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        setAllow(false);
        setChecking(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cancelled) return;

      if (res.ok) {
        // ? customer existuje ? pustíme dál
        setRedirectToOnboarding(false);
        setAllow(true);
      } else if (res.status === 404) {
        // ? customer neexistuje ? onboarding
        setRedirectToOnboarding(true);
        setAllow(false);
      } else {
        setAllow(false);
      }

      setChecking(false);
    }

    setChecking(true);
    run();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, location.pathname]);

  if (!isLoaded || checking) {
    return <div className="p-6 text-slate-400">Nacítám…</div>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  if (redirectToOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (!allow) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
}
