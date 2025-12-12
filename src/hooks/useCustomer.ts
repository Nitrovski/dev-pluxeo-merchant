import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

export function useCustomer() {
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, isLoaded: userLoaded, user } = useUser();

  const [customerId, setCustomerId] = useState<string | null>(null);

  console.log("[useCustomer] hook render");

  useEffect(() => {
    console.log("[useCustomer] effect fired", { authLoaded, userLoaded, isSignedIn });

    if (!authLoaded || !userLoaded) return;
    if (!isSignedIn) {
      setCustomerId(null);
      return;
    }

    let cancelled = false;

    (async () => {
      // token retry – po loginu muže chvíli trvat
      let token: string | null = null;
      for (let i = 0; i < 6; i++) {
        token = await getToken();
        if (token) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!token) {
        console.warn("[useCustomer] token not ready");
        return;
      }

      const meUrl = `${API_BASE_URL}/api/me`;
      console.log("[useCustomer] GET", meUrl);

      const meRes = await fetch(meUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const data = await meRes.json();
        console.log("[useCustomer] /api/me ok:", data);
        if (!cancelled && typeof data?.customerId === "string") {
          setCustomerId(data.customerId);
        }
        return;
      }

      console.warn("[useCustomer] /api/me failed:", meRes.status);

      if (meRes.status === 404) {
        const ensureUrl = `${API_BASE_URL}/api/customers/ensure`;
        console.log("[useCustomer] POST", ensureUrl);

        const ensureRes = await fetch(ensureUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: user?.fullName || "My Business",
            email: user?.primaryEmailAddress?.emailAddress || null,
          }),
        });

        const txt = await ensureRes.text();
        console.log("[useCustomer] ensure response:", ensureRes.status, txt);

        if (ensureRes.ok) {
          const ensured = JSON.parse(txt);
          if (!cancelled && typeof ensured?.customerId === "string") {
            setCustomerId(ensured.customerId);
          }
          return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken, user]);

  return customerId;
}
