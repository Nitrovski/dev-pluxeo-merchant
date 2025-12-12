// src/routes/ProtectedRoute.tsx
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "@/config";
import { getMeCache, setMeCache } from "@/lib/meCache";

type GateState = "checking" | "signin" | "onboarding" | "allow";

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

      // neprihlášen ? sign-in
      if (!isSignedIn) {
        if (!cancelled) setGate("signin");
        return;
      }

      // onboarding stránku vždy povolíme (jinak vzniká loop)
      if (isOnboardingRoute) {
        if (!cancelled) setGate("allow");
        return;
      }

      // ? cache hit ? okamžite allow (žádný fetch, žádná prodleva)
      const cached = getMeCache(60_000);
      if (cached) {
        if (!cancelled) setGate("allow");
        return;
      }

      // cache miss ? jednou zavoláme /api/me
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
        setGate("onboarding");
        return;
      }

      if (res.ok) {
        // uložíme do cache
try {
    const data = await res.json();

    if (
      data &&
      typeof data.merchantId === "string" &&
      typeof data.customerId === "string"
    ) {
      setMeCache(data); // ? typove OK
      setGate("allow");
      return;
    }

    // když backend vrátí neco divného, radši vyžádej onboarding (nebo signin)
    setGate("onboarding");
    return;
  } catch {
    // když to není JSON, je to chyba backendu
    setGate("signin");
    return;
  }
}
      // jiná chyba ? radši sign-in (mužeš udelat i error page)
      setGate("signin");
    }

    run();

    return () => {
      cancelled = true;
    };

    // ? NEzávisí na location.pathname ? neprobíhá pri každé navigaci v appce
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
