import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

export type DashboardResponse = {
  kpis: {
    activeCards: number;
    newCards7d: number;
    newCards30d: number;
    totalStamps: number;
    totalRewards: number;
  };
  series: {
    newCardsDaily: { day: string; count: number }[];
  };
  activity: { type: "card_created"; title: string; meta: string; ts: string }[];
};

export function useDashboard() {
  const { getToken } = useAuth();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Dashboard load failed");
      }

      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch (e: any) {
      setError(e?.message ?? "Chyba nactení dashboardu");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refresh };
}
