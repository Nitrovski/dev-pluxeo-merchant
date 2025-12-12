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

    async function run() {
      // token retry (po loginu bývá chvíli null)
      let token: string | null = null;
      for (let i = 0; i < 6; i++) {
        token = await getToken();
        if (token) break;
        await new Promise((r) => setTimeout(r, 300));
      }
      if (!token) return;

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

      if (meRes.status === 404) {
        const ensureRes = await fetch(`${API_BASE_URL}/api/customers/ensure`, {
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

        if (ensureRes.ok) {
          const ensured = await ensureRes.json();
          if (!cancelled && typeof ensured?.customerId === "string") {
            setCustomerId(ensured.customerId);
          }
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken, user]);

  return customerId;
}
