import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  const me = getMeCache();

  if (!me) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Nastavení podniku</CardTitle>
              <CardDescription>
                Profil není nactený (meCache je prázdná). Otevri onboarding nebo se znovu prihlas.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Nastavení podniku</h1>
          <p className="text-sm text-muted-foreground">
            Zatím jen náhled hodnot nastavených pri onboardingu.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Identita</CardTitle>
            <CardDescription>
              Toto ted máme v `MeResponse`.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Merchant ID" value={me.merchantId} />
            <Field label="Customer ID" value={me.customerId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kontaktní údaje</CardTitle>
            <CardDescription>
              Pridáme pozdeji (až bude v API / onboardingu: název, telefon, web, adresa).
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Zatím není co zobrazit.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
