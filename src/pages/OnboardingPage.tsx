import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

import { setMeCache } from "@/lib/meCache";

export function OnboardingPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [ico, setIco] = useState("");
  const [address, setAddress] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Missing token");

      const payload = {
        name: name.trim(),
        phone: phone.trim() || null,
        ico: ico.trim() || null,
        address: address.trim() || null,
        email: user?.primaryEmailAddress?.emailAddress ?? null,
      };

      const res = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      // ?? nacti odpoved jako JSON (lepší než res.text())
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data === "string"
            ? data
            : data?.message || data?.error || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      // ? ulož me do cache a presmeruj
      setMeCache(data);
      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      console.error("[Onboarding] submit error:", e);
      setError(e?.message ?? "Onboarding failed");
    } finally {
      setSaving(false);
    }
  }

  const canSubmit = name.trim().length > 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Nastavení podniku</CardTitle>
            <CardDescription>
              Ješte potrebujeme pár údaju, at mužeš zacít vytváret vernostní program.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Název podniku */}
              <div className="space-y-1">
                <label className="text-sm text-slate-300">
                  Název podniku <span className="text-red-400">*</span>
                </label>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-slate-600"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Napr. Káva u Tomáše"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {/* Telefon */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">Telefon (volitelné)</label>
                  <input
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-slate-600"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+420 777 123 456"
                    inputMode="tel"
                  />
                </div>

                {/* ICO */}
                <div className="space-y-1">
                  <label className="text-sm text-slate-300">ICO (volitelné)</label>
                  <input
                    className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-slate-600"
                    value={ico}
                    onChange={(e) => setIco(e.target.value)}
                    placeholder="12345678"
                    inputMode="numeric"
                  />
                </div>
              </div>

              {/* Adresa */}
              <div className="space-y-1">
                <label className="text-sm text-slate-300">Adresa (volitelné)</label>
                <input
                  className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-50 outline-none focus:border-slate-600"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ulice 12, Praha"
                />
              </div>

              {error && (
                <div className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="submit" disabled={!canSubmit || saving}>
                  {saving ? "Ukládám…" : "Pokracovat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
