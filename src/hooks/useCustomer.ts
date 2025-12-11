import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

export function useCustomer() {
  const { getToken } = useAuth();
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCustomerId(data.customerId);
      }
    }

    load();
  }, [getToken]);

  return customerId;
}
