import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/config";
import { getMeCache, setMeCache } from "@/lib/meCache";
import type { MeResponse } from "@/lib/meCache";

export function SettingsPage() {
  const { getToken } = useAuth();
  const [me, setMe] = useState<MeResponse | null>(() => getMeCache());
  const [loading, setLoading] = useState(!me);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    ico: "",
    phone: "",
    address: "",
    websiteUrl: "",
  });

  async function loadMe() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Nepodařilo se načíst profil.");
      const data: MeResponse = await res.json();
      setMeCache(data);
      setMe(data);
      setForm({
        name: data.name ?? "",
        ico: data.ico ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        websiteUrl: data.websiteUrl ?? "",
      });
    } catch (e: any) {
      setError(e?.message ?? "Chyba načtení.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!me) loadMe();
    else {
      setForm({
        name: me.name ?? "",
        ico: me.ico ?? "",
        phone: me.phone ?? "",
        address: me.address ?? "",
        websiteUrl: me.websiteUrl ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE_URL}/api/me`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          ico: form.ico || null,
          phone: form.phone || null,
          address: form.address, // může být i ""
          websiteUrl: form.websiteUrl || null,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Nepodařilo se uložit změny.");
      }

      const data: MeResponse = await res.json();
      setMeCache(data);
      setMe(data);
      setIsEditing(false);
    } catch (e: any) {
      setError(e?.message ?? "Chyba uložení.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Nastavení podniku</h1>
            <p className="text-sm text-muted-foreground">Uprav si profil podniku kdykoliv.</p>
          </div>

          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} disabled={loading}>
              Upravit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setIsEditing(false); loadMe(); }} disabled={loading}>
                Zrušit
              </Button>
              <Button onClick={save} disabled={loading || !form.name.trim()}>
                Uložit
              </Button>
            </div>
          )}
        </div>

        {error && <div className="text-sm text-red-400">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle>Profil podniku</CardTitle>
            <CardDescription>Tyto údaje se používají v merchant rozhraní a na kartě.</CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm text-muted-foreground">Název podniku *</div>
              <Input
                value={form.name}
                disabled={!isEditing || loading}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Např. Káva u Tomáše"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Telefon</div>
              <Input
                value={form.phone}
                disabled={!isEditing || loading}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+420 777 123 456"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">IČO</div>
              <Input
                value={form.ico}
                disabled={!isEditing || loading}
                onChange={(e) => setForm((p) => ({ ...p, ico: e.target.value }))}
                placeholder="12345678"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm text-muted-foreground">Adresa</div>
              <Input
                value={form.address}
                disabled={!isEditing || loading}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Ulice 12, Praha"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm text-muted-foreground">Web</div>
              <Input
                value={form.websiteUrl}
                disabled={!isEditing || loading}
                onChange={(e) => setForm((p) => ({ ...p, websiteUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
