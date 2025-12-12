// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
import { getMeCache, setMeCache, clearMeCache } from "@/lib/meCache";
import type { MeResponse } from "@/lib/meCache";

type GateState = "checking" | "signin" | "allow" | "toOnboarding" | "toDashboard";

function isValidMe(data: any): data is MeResponse {
  return (
    data &&
    typeof data === "object" &&
    typeof data.onboardingCompleted === "boolean" &&
    "name" in data &&
    "ico" in data &&
    "phone" in data &&
    "address" in data &&
    "websiteUrl" in data
  );
}

export function ProtectedRoute() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();
  const [gate, setGate] = useState<GateState>("checking");

  useEffect(() => {
    let cancelled = false;

    async function decide(me: MeResponse) {
      const isOnboarding = location.pathname === "/onboarding";

      // onboarding není hotový -> všude jinam presmeruj na onboarding
      if (!me.onboardingCompleted && !isOnboarding) {
        setGate("toOnboarding");
        return;
      }

      // onboarding hotový -> na /onboarding už nepatríš, pošli na dashboard
      if (me.onboardingCompleted && isOnboarding) {
        setGate("toDashboard");
        return;
      }

      setGate("allow");
    }

    async function run() {
      if (!isLoaded) return;

      if (!isSignedIn) {
        if (!cancelled) setGate("signin");
        return;
      }

      // cache first
      const cached = getMeCache(60_000);
      if (cached) {
        if (!cancelled) await decide(cached);
        return;
      }

      // fetch /api/me
      if (!cancelled) setGate("checking");

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
        // customer neexistuje -> onboarding
        setGate(location.pathname === "/onboarding" ? "allow" : "toOnboarding");
        return;
      }

      if (!res.ok) {
        // chyba -> radši znovu login
        clearMeCache();
        setGate("signin");
        return;
      }

      try {
        const data = await res.json();

        if (!isValidMe(data)) {
          clearMeCache();
          setGate("signin");
          return;
        }

        setMeCache(data);
        await decide(data);
      } catch {
        clearMeCache();
        setGate("signin");
      }
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

  if (gate === "toOnboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  if (gate === "toDashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
