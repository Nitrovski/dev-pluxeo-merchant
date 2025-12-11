import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

const FALLBACK_CUSTOMER_ID =
  import.meta.env.VITE_CUSTOMER_ID || undefined; // jen docasný fallback

export function useCustomer() {
  const { getToken } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const token = await getToken();
        if (!token) {
          console.warn("[useCustomer] Missing Clerk token");
          // fallback
          if (FALLBACK_CUSTOMER_ID) {
            console.warn(
              "[useCustomer] Using fallback VITE_CUSTOMER_ID:",
              FALLBACK_CUSTOMER_ID
            );
            setCustomerId(FALLBACK_CUSTOMER_ID);
          }
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          console.warn(
            "[useCustomer] /api/me returned",
            res.status,
            res.statusText
          );
          // pokud backend ješte nemá /api/me, spadneme na fallback
          if (FALLBACK_CUSTOMER_ID) {
            console.warn(
              "[useCustomer] Falling back to VITE_CUSTOMER_ID:",
              FALLBACK_CUSTOMER_ID
            );
            setCustomerId(FALLBACK_CUSTOMER_ID);
          }
          return;
        }

        const data = await res.json();
        console.log("[useCustomer] /api/me response:", data);

        if (data?.customerId && typeof data.customerId === "string") {
          setCustomerId(data.customerId);
        } else if (FALLBACK_CUSTOMER_ID) {
          console.warn(
            "[useCustomer] /api/me has no customerId, fallback to VITE_CUSTOMER_ID"
          );
          setCustomerId(FALLBACK_CUSTOMER_ID);
        }
      } catch (err) {
        console.error("[useCustomer] Error while loading /api/me:", err);
        if (FALLBACK_CUSTOMER_ID) {
          console.warn(
            "[useCustomer] Error, falling back to VITE_CUSTOMER_ID:",
            FALLBACK_CUSTOMER_ID
          );
          setCustomerId(FALLBACK_CUSTOMER_ID);
        }
      }
    }

    loadCustomer();
  }, [getToken]);

  return customerId;
}
