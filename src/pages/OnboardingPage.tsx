import { useState } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/config";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";

export function OnboardingPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) throw new Error("Missing token");

      const res = await fetch(`${API_BASE_URL}/api/onboarding`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: user?.primaryEmailAddress?.emailAddress ?? null,
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `HTTP ${res.status}`);
      }

      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "Onboarding failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-lg">
        <h1 className="text-2xl font-semibold">Nastavení podniku</h1>
        <p className="mt-2 text-sm text-slate-300">
          Zadej název podniku, aby šlo dokoncit nastavení úctu.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="text-sm text-slate-300">Název podniku</label>
            <input
              className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-50"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Napr. Káva u Tomáše"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <Button disabled={saving || !name.trim()}>
            {saving ? "Ukládám…" : "Pokracovat"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
