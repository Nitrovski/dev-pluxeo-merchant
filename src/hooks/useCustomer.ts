import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

const FALLBACK_CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID || undefined;

export function useCustomer() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, isLoaded: userLoaded, user } = useUser();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (!isSignedIn) {
      setCustomerId(null);
      return;
    }

    let cancelled = false;

    async function ensureCustomerWithRetry() {
      // zkusíme token párkrát, protože po loginu nekdy chvíli trvá než je session ready
      let token: string | null = null;
      for (let i = 0; i < 6; i++) {
        token = await getToken();
        if (token) break;
        await new Promise((r) => setTimeout(r, 300));
      }

      if (!token) {
        console.warn("[useCustomer] Token not ready after retry");
        if (FALLBACK_CUSTOMER_ID && !cancelled) setCustomerId(FALLBACK_CUSTOMER_ID);
        return;
      }

      // 1) zkus /api/me
      const meRes = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const data = await meRes.json();
        console.log("[useCustomer] /api/me response:", data);
        if (!cancelled && typeof data?.customerId === "string") {
          setCustomerId(data.customerId);
        }
        return;
      }

      // 2) pokud 404 -> zavolej ensure
      if (meRes.status === 404) {
        console.log("[useCustomer] /api/me 404 => calling /api/customers/ensure");

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

        const txt = await ensureRes.text();
        console.log("[useCustomer] ensure status:", ensureRes.status, "body:", txt);

        if (ensureRes.ok) {
          const ensured = JSON.parse(txt);
          if (!cancelled && typeof ensured?.customerId === "string") {
            setCustomerId(ensured.customerId);
          }
          return;
        }
      }

      // 3) ostatní chyby
      console.warn("[useCustomer] /api/me failed:", meRes.status, meRes.statusText);
      if (FALLBACK_CUSTOMER_ID && !cancelled) setCustomerId(FALLBACK_CUSTOMER_ID);
    }

    ensureCustomerWithRetry();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken, user]);

  return customerId;
}
