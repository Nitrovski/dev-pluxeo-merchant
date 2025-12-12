// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";

type GateState = "checking" | "signin" | "onboarding" | "allow";

export function ProtectedRoute() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();
  const [gate, setGate] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // vždy zacínáme "checking"
      setGate("checking");

      if (!isLoaded) return;

      // neprihlášen ? sign-in
      if (!isSignedIn) {
        if (!cancelled) setGate("signin");
        return;
      }

      // ? onboarding stránku vždy povolíme (jinak vzniká loop)
      if (location.pathname === "/onboarding") {
        if (!cancelled) setGate("allow");
        return;
      }

      const token = await getToken();
      if (!token) {
        if (!cancelled) setGate("signin");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (cancelled) return;

      if (res.status === 404) {
        setGate("onboarding");
        return;
      }

      if (res.ok) {
        setGate("allow");
        return;
      }

      // jiná chyba = radši sign-in (nebo mužeš dát error page)
      setGate("signin");
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, location.pathname]);

  if (gate === "checking" || !isLoaded) {
    return <div className="p-6 text-slate-400">Nacítám…</div>;
  }

  if (gate === "signin") {
    return <Navigate to="/sign-in" replace state={{ from: location }} />;
  }

  if (gate === "onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
