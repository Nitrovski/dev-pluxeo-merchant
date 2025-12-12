// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config";
import { getMeCache, setMeCache } from "@/lib/meCache";
import type { MeResponse } from "@/lib/meCache";

type GateState = "checking" | "signin" | "onboarding" | "allow";

function isValidMe(data: any): data is MeResponse {
  return (
    data &&
    typeof data === "object" &&
    typeof data.onboardingCompleted === "boolean" &&
    ("name" in data) &&
    ("ico" in data) &&
    ("phone" in data) &&
    ("address" in data) &&
    ("websiteUrl" in data)
  );
}

export function ProtectedRoute() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const location = useLocation();
  const [gate, setGate] = useState<GateState>("checking");

  const isOnboardingRoute = useMemo(
    () => location.pathname === "/onboarding",
    [location.pathname]
  );

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!isLoaded) return;

      // neprihlášen -> sign-in
      if (!isSignedIn) {
        if (!cancelled) setGate("signin");
        return;
      }

      // onboarding stránku vždy povolíme (jinak vzniká loop)
      if (isOnboardingRoute) {
        if (!cancelled) setGate("allow");
        return;
      }

      // cache hit -> rozhodni podle onboardingCompleted
      const cached = getMeCache(60_000);
      if (cached) {
        if (!cancelled) {
          setGate(cached.onboardingCompleted ? "allow" : "onboarding");
        }
        return;
      }

      // cache miss -> zavolej /api/me
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

      if (!res.ok) {
        // pokud 404 = customer ješte neexistuje -> onboarding
        if (res.status === 404) {
          setGate("onboarding");
          return;
        }

        setGate("signin");
        return;
      }

      // ok -> parse + validace shape
      try {
        const data = await res.json();

        if (!isValidMe(data)) {
          // backend vrátil neco jiného než cekáme
          setGate("signin");
          return;
        }

        setMeCache(data);
        setGate(data.onboardingCompleted ? "allow" : "onboarding");
        return;
      } catch (e) {
        setGate("signin");
        return;
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, isOnboardingRoute]);

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
