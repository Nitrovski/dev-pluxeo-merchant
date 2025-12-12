import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { API_BASE_URL } from "@/config";

/**
 * Typ jedné denní hodnoty pro graf
 */
export type DailyPoint = {
  day: string; // YYYY-MM-DD
  count: number;
};

export type DashboardResponse = {
  kpis: {
    // stavové (Card)
    activeCards: number;
    totalStamps: number;
    totalRewards: number;

    // card-based (z Card.createdAt)
    newCards7d: number;
    newCards30d?: number;

    // event-based (CardEvent)
    stampsToday: number;
    stamps7d: number;
    rewardsToday: number;
    rewards7d: number;
  };

  series: {
    // event-based
    stampsDaily: DailyPoint[];
    rewardsDaily: DailyPoint[];

    // card-based (pokud backend posílá)
    newCardsDaily?: DailyPoint[];
  };

  activity: {
    type: "stamp" | "reward" | "card_created" | "note";
    title: string;
    meta: string;
    ts: string;
  }[];
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
      if (!token) {
        throw new Error("Missing auth token");
      }

      const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Dashboard load failed");
      }

      const json = (await res.json()) as DashboardResponse;
      setData(json);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Chyba nactení dashboardu");
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    refresh,
  };
}
