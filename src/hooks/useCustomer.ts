import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

const FALLBACK_CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID || undefined;

export function useCustomer() {
  const { getToken, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;
    if (!isSignedIn) {
      setCustomerId(null);
      return;
    }

    let cancelled = false;

    async function loadCustomer() {
      const token = await getToken();
      if (!token) {
        console.warn("[useCustomer] Missing Clerk token even though signed in");
        return;
      }

      // 1) zkus /api/me
      const meRes = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const data = await meRes.json();
        if (!cancelled && typeof data?.customerId === "string") {
          setCustomerId(data.customerId);
        }
        return;
      }

      // 401 = token/auth problém, ne fallback
      if (meRes.status === 401) {
        console.warn("[useCustomer] /api/me unauthorized (401)");
        return;
      }

      // 404 = nemáš customer v DB => vytvor ho pres ensure
      if (meRes.status === 404) {
        const ensureRes = await fetch(`${API_BASE_URL}/api/customers/ensure`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user?.unsafeMetadata?.businessName || user?.fullName || "My Business",
            email: user?.primaryEmailAddress?.emailAddress || null,
          }),
        });

        if (ensureRes.ok) {
          const ensured = await ensureRes.json();
          if (!cancelled && typeof ensured?.customerId === "string") {
            setCustomerId(ensured.customerId);
          }
          return;
        }

        console.warn("[useCustomer] ensure failed:", ensureRes.status, await ensureRes.text());
        // volitelne fallback pro dev
        if (!cancelled && FALLBACK_CUSTOMER_ID) setCustomerId(FALLBACK_CUSTOMER_ID);
        return;
      }

      // jiné chyby
      console.warn("[useCustomer] /api/me failed:", meRes.status, await meRes.text());
      if (!cancelled && FALLBACK_CUSTOMER_ID) setCustomerId(FALLBACK_CUSTOMER_ID);
    }

    loadCustomer();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isUserLoaded, isSignedIn, getToken, user]);

  return customerId;
}
