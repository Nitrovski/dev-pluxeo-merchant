import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMeCache } from "@/lib/meCache";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-base font-medium">{value ?? "—"}</div>
    </div>
  );
}

export function SettingsPage() {
  const me = getMeCache(); // { merchantId, customerId, ... } podle tvého MeResponse

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Nastavení podniku</h1>
            <p className="text-sm text-muted-foreground">
              Zatím jen náhled. Úpravy pridáme pozdeji.
            </p>
          </div>

          <Button variant="secondary" disabled title="Pridáme pozdeji">
            Upravit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identita</CardTitle>
            <CardDescription>
              Hodnoty jsou nyní nastavené pri onboardingu.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Merchant ID" value={me?.merchantId} />
            <Field label="Customer ID" value={me?.customerId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontaktní údaje</CardTitle>
            <CardDescription>
              Pripravujeme na pozdejší editaci (název, telefon, web, adresa…).
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Název podniku" value={me?.name ?? null} />
            <Field label="Telefon" value={me?.phone ?? null} />
            <Field label="Web" value={me?.websiteUrl ?? null} />
            <Field label="Adresa" value={me?.address ?? null} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
