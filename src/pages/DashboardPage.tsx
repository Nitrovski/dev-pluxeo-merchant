import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, ScanLine, Gift, Users, ArrowRight } from "lucide-react";

type KPI = {
  label: string;
  value: string;
  hint?: string;
  delta?: string; // "+12%" / "-3%"
  series?: number[]; // sparkline
  icon: React.ReactNode;
};

function Sparkline({ series }: { series: number[] }) {
  const w = 120;
  const h = 28;
  const pad = 2;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);

  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * (w - pad * 2) + pad;
      const y = h - ((v - min) / span) * (h - pad * 2) - pad;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-90">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

function StatCard({ kpi }: { kpi: KPI }) {
  const isPositive = (kpi.delta ?? "").trim().startsWith("+");
  const isNegative = (kpi.delta ?? "").trim().startsWith("-");

  return (
    <Card className="bg-slate-950/60 border-slate-800">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-sm text-slate-400">{kpi.label}</div>
            <div className="text-2xl font-semibold text-slate-50">{kpi.value}</div>

            <div className="flex items-center gap-2">
              {kpi.delta && (
                <Badge
                  variant="secondary"
                  className={[
                    "border",
                    isPositive ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : "",
                    isNegative ? "border-red-500/30 text-red-300 bg-red-500/10" : "",
                    !isPositive && !isNegative ? "border-slate-700 text-slate-200 bg-slate-800/40" : "",
                  ].join(" ")}
                >
                  {kpi.delta}
                </Badge>
              )}
              {kpi.hint && <span className="text-xs text-slate-400">{kpi.hint}</span>}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2">
              {kpi.icon}
            </div>
            {kpi.series && <Sparkline series={kpi.series} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  // TODO: napojit na API /api/dashboard (metrics + time series + activity)
  const kpis: KPI[] = [
    {
      label: "Aktivní karty",
      value: "128",
      delta: "+8%",
      hint: "za posledních 30 dní",
      series: [92, 98, 101, 97, 110, 118, 123, 128],
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      label: "Razítka dnes",
      value: "34",
      delta: "+12%",
      hint: "oproti včerejšku",
      series: [8, 11, 9, 14, 16, 21, 27, 34],
      icon: <ScanLine className="h-5 w-5" />,
    },
    {
      label: "Uplatněné odměny",
      value: "7",
      delta: "+2",
      hint: "tento týden",
      series: [1, 2, 1, 3, 2, 4, 5, 7],
      icon: <Gift className="h-5 w-5" />,
    },
    {
      label: "Noví zákazníci",
      value: "19",
      delta: "+5%",
      hint: "posledních 7 dní",
      series: [2, 3, 4, 3, 5, 6, 7, 9],
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const activity = [
    { title: "Přidáno razítko", meta: "Karta: kavarna-123 • před 2 min" },
    { title: "Uplatněna odměna", meta: "Karta: john-doe • před 18 min" },
    { title: "Nová karta přidána do Walletu", meta: "Karta: eva-nova • před 1 h" },
    { title: "Přidáno razítko", meta: "Karta: petr-777 • před 3 h" },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
            <p className="text-sm text-slate-400">
              Přehled výkonu věrnostního programu a poslední aktivita.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" disabled title="Brzy">
              Scan mód
            </Button>
            <Button disabled title="Brzy">
              Přidat razítko <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} kpi={kpi} />
          ))}
        </div>

        {/* Lower grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Activity */}
          <Card className="lg:col-span-2 bg-slate-950/60 border-slate-800">
            <CardHeader>
              <CardTitle>Aktivita</CardTitle>
              <CardDescription>Co se dělo naposledy.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {activity.map((a, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/30 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-50">{a.title}</div>
                    <div className="text-xs text-slate-400">{a.meta}</div>
                  </div>
                  <Badge variant="secondary" className="border border-slate-800 bg-slate-900/30 text-slate-200">
                    detail
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick actions / next steps */}
          <Card className="bg-slate-950/60 border-slate-800">
            <CardHeader>
              <CardTitle>Další kroky</CardTitle>
              <CardDescription>Co nastavit jako další.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="text-sm font-medium text-slate-50">Nastav šablonu karty</div>
                <div className="text-xs text-slate-400">Barvy, texty, web, otevírací doba…</div>
                <div className="mt-3">
                  <Button asChild variant="secondary" size="sm">
                    <a href="/card-template">Otevřít šablonu</a>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="text-sm font-medium text-slate-50">Vytiskni QR pro zákazníky</div>
                <div className="text-xs text-slate-400">QR → přidání karty do Walletu.</div>
                <div className="mt-3">
                  <Button variant="secondary" size="sm" disabled title="Brzy">
                    Generovat QR
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                <div className="text-sm font-medium text-slate-50">Scan mód</div>
                <div className="text-xs text-slate-400">Rychlé přidání razítka přes kameru / čtečku.</div>
                <div className="mt-3">
                  <Button variant="secondary" size="sm" disabled title="Brzy">
                    Spustit scan
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
