import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { API_BASE_URL } from "@/config";

type MerchantCard = {
  _id: string;
  cardId?: string;
  headline?: string;
  subheadline?: string;
  themeColor?: string;
  stamps?: number;
  rewards?: number;
};

export function CardsPage() {
  const { getToken } = useAuth();

  const [cards, setCards] = useState<MerchantCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCards() {
      try {
        setLoading(true);
        setError(null);

        const token = await getToken();

        const res = await fetch(`${API_BASE_URL}/api/cards`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();
        setCards(data);
      } catch (err: any) {
        console.error("Chyba pri nacítání karet:", err);
        setError(err?.message ?? "Neco se pokazilo pri nacítání karet.");
      } finally {
        setLoading(false);
      }
    }

    // jen pokud máme nastavenou BASE URL
    if (API_BASE_URL) {
      loadCards();
    } else {
      setLoading(false);
      setError("Chybí konfigurace API_BASE_URL.");
    }
  }, [getToken]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Moje karty</h1>
          <p className="text-sm text-slate-400">
            Vytvárej a spravuj vernostní karty pro své zákazníky.
          </p>
        </div>
        <Button size="sm">Vytvorit kartu</Button>
      </div>

      {loading && (
        <p className="text-sm text-slate-400">Nacítám karty…</p>
      )}

      {error && !loading && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {!loading && !error && cards.length === 0 && (
        <p className="text-sm text-slate-400">
          Zatím nemáš žádné karty. Klikni na „Vytvorit kartu“ a založ první.
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Card key={card._id}>
            <CardHeader>
              <CardTitle>{card.headline || "Bez názvu"}</CardTitle>
              {card.subheadline && (
                <CardDescription>{card.subheadline}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-400">
                ID karty:{" "}
                <span className="font-mono">
                  {card.cardId ?? card._id}
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Razítka: {card.stamps ?? 0} · Odmeny: {card.rewards ?? 0}
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm">
                QR kód
              </Button>
              <Button variant="ghost" size="sm">
                Detail
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
