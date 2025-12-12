import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/config";
import { getMeCache, setMeCache } from "@/lib/meCache";
import type { MeResponse } from "@/lib/meCache"; // pokud MeResponse exportuješ odtud; jinak uprav import

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-base font-medium">{value ?? "—"}</div>
    </div>
  );
}

export function SettingsPage() {
  const { getToken } = useAuth();

  const [me, setMe] = useState<MeResponse | null>(() => getMeCache());
  const [loading, setLoading] = useState(!me);
  const [error, setError] = useState<string | null>(null);

  async function loadMe() {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API /api/me failed (${res.status}): ${text}`);
      }

      const data: MeResponse = await res.json();
      setMeCache(data);
      setMe(data);
    } catch (e: any) {
      console.error("[SettingsPage] loadMe failed:", e);
      setError(e?.message ?? "Nepodarilo se nacíst profil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Nastavení podniku</h1>
            <p className="text-sm text-muted-foreground">
              Zatím jen náhled hodnot nastavených pri onboardingu.
            </p>
          </div>

          <Button variant="secondary" disabled title="Pridáme pozdeji">
            Upravit
          </Button>
        </div>

        {loading && (
          <Card>
            <CardHeader>
              <CardTitle>Nacítám profil…</CardTitle>
              <CardDescription>Chvilku vydrž.</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!loading && error && (
          <Card>
            <CardHeader>
              <CardTitle>Profil se nepodarilo nacíst</CardTitle>
              <CardDescription className="break-words">{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={loadMe}>Zkusit znovu</Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && me && (
          <Card>
            <CardHeader>
              <CardTitle>Identita</CardTitle>
              <CardDescription>Nacteno z onboardingu (/api/me).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Název" value={me.name} />
    <Field label="ICO" value={me.ico} />
    <Field label="Telefon" value={me.phone} />
    <Field label="Adresa" value={me.address} />
    <Field label="Web" value={me.websiteUrl} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
