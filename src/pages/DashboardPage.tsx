import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  ScanLine,
  Gift,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
} from "lucide-react";

type KPI = {
  label: string;
  value: string;
  hint?: string;
  delta?: string; // "+12%" / "-3%"
  series?: number[]; // sparkline
  icon: React.ReactNode;
};

type ActivityItem = {
  type: "stamp" | "reward" | "new_wallet" | "note";
  title: string;
  meta: string;
};

function Sparkline({ series, id }: { series: number[]; id: string }) {
  const w = 150;
  const h = 40;
  const pad = 4;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);

  const points = series.map((v, i) => {
    const x = (i / (series.length - 1)) * (w - pad * 2) + pad;
    const y = h - ((v - min) / span) * (h - pad * 2) - pad;
    return { x, y };
  });

  const pts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  // area fill: from polyline down to bottom
  const area = [
    `M ${points[0].x.toFixed(1)} ${h - pad}`,
    ...points.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${points[points.length - 1].x.toFixed(1)} ${h - pad}`,
    "Z",
  ].join(" ");

  const lineId = `line-${id}`;
  const fillId = `fill-${id}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <defs>
        <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(56,189,248,0.9)" />
          <stop offset="50%" stopColor="rgba(99,102,241,0.9)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.9)" />
        </linearGradient>

        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.22)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>

      <path d={area} fill={`url(#${fillId})`} />

      <polyline
        fill="none"
        stroke={`url(#${lineId})`}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

function StatCard({ kpi, sparkId }: { kpi: KPI; sparkId: string }) {
  const isPositive = (kpi.delta ?? "").trim().startsWith("+");
  const isNegative = (kpi.delta ?? "").trim().startsWith("-");

  return (
    <Card className="bg-slate-950/60 border-slate-800 overflow-hidden">
      <CardContent className="relative p-5 min-h-[132px]">
        {/* subtle background sheen */}
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        {/* icon top-right */}
        <div className="absolute right-4 top-4 rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-slate-200">
          {kpi.icon}
        </div>

        {/* sparkline bottom-right */}
        {kpi.series && (
          <div className="absolute right-3 bottom-3 text-slate-500/90 pointer-events-none">
            <Sparkline series={kpi.series} id={sparkId} />
          </div>
        )}

        <div className="relative space-y-2 pr-36 pb-10">
  <div className="text-sm text-slate-400">{kpi.label}</div>
  <div className="text-2xl font-semibold text-slate-50">{kpi.value}</div>

  <div className="flex items-center gap-2 pt-1">
    {kpi.delta && (
      <span
        className={[
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
          isPositive ? "border-emerald-500/30 text-emerald-300 bg-emerald-500/10" : "",
          isNegative ? "border-red-500/30 text-red-300 bg-red-500/10" : "",
          !isPositive && !isNegative ? "border-slate-700 text-slate-200 bg-slate-800/40" : "",
        ].join(" ")}
      >
        {kpi.delta}
      </span>
    )}

    {kpi.hint && (
      <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/35 px-2 py-0.5 text-xs text-slate-300">
        {kpi.hint}
      </span>
    )}
  </div>
</div>

      </CardContent>
    </Card>
  );
}

function ActivityTypeChip({ type }: { type: ActivityItem["type"] }) {
  const map: Record<ActivityItem["type"], { label: string; icon: React.ReactNode; cls: string }> = {
    stamp: {
      label: "Razítko",
      icon: <ScanLine className="h-3.5 w-3.5" />,
      cls: "border-sky-500/30 text-sky-200 bg-sky-500/10",
    },
    reward: {
      label: "Odměna",
      icon: <Gift className="h-3.5 w-3.5" />,
      cls: "border-emerald-500/30 text-emerald-200 bg-emerald-500/10",
    },
    new_wallet: {
      label: "Wallet",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      cls: "border-indigo-500/30 text-indigo-200 bg-indigo-500/10",
    },
    note: {
      label: "Info",
      icon: <Sparkles className="h-3.5 w-3.5" />,
      cls: "border-slate-600 text-slate-200 bg-slate-800/40",
    },
  };

  const v = map[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${v.cls}`}>
      {v.icon}
      {v.label}
    </span>
  );
}

function ActivityIcon({ type }: { type: ActivityItem["type"] }) {
  const icon =
    type === "stamp" ? (
      <ScanLine className="h-4 w-4" />
    ) : type === "reward" ? (
      <Gift className="h-4 w-4" />
    ) : type === "new_wallet" ? (
      <CreditCard className="h-4 w-4" />
    ) : (
      <Sparkles className="h-4 w-4" />
    );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-2 text-slate-200">
      {icon}
    </div>
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

  const activity: ActivityItem[] = [
    { type: "stamp", title: "Přidáno razítko", meta: "Karta: kavarna-123 • před 2 min" },
    { type: "reward", title: "Uplatněna odměna", meta: "Karta: john-doe • před 18 min" },
    { type: "new_wallet", title: "Nová karta přidána do Walletu", meta: "Karta: eva-nova • před 1 h" },
    { type: "stamp", title: "Přidáno razítko", meta: "Karta: petr-777 • před 3 h" },
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
          {kpis.map((kpi, idx) => (
            <StatCard key={kpi.label} kpi={kpi} sparkId={`kpi-${idx}`} />
          ))}
        </div>

        {/* Lower grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Activity */}
          <Card className="lg:col-span-2 bg-slate-950/60 border-slate-800 overflow-hidden">
            <CardHeader>
              <CardTitle>Aktivita</CardTitle>
              <CardDescription>Co se dělo naposledy.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {activity.map((a, idx) => (
                <div
                  key={idx}
                  className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/25 px-4 py-4 hover:bg-slate-900/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <ActivityIcon type={a.type} />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold text-slate-50">{a.title}</div>
                        <ActivityTypeChip type={a.type} />
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{a.meta}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/30 px-3 py-1 hints text-xs text-slate-200 opacity-90 hover:opacity-100"
                    disabled
                    title="Brzy"
                  >
                    detail <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Next steps */}
          <Card className="bg-slate-950/60 border-slate-800 overflow-hidden">
            <CardHeader>
              <CardTitle>Další kroky</CardTitle>
              <CardDescription>Co nastavit jako další.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="text-sm font-semibold text-slate-50">Nastav šablonu karty</div>
                <div className="text-xs text-slate-400">Barvy, texty, web, otevírací doba…</div>
                <div className="mt-3">
                  <Button asChild variant="secondary" size="sm">
                    <a href="/card-template">Otevřít šablonu</a>
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="text-sm font-semibold text-slate-50">Vytiskni QR pro zákazníky</div>
                <div className="text-xs text-slate-400">QR → přidání karty do Walletu.</div>
                <div className="mt-3">
                  <Button variant="secondary" size="sm" disabled title="Brzy">
                    Generovat QR
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-4">
                <div className="text-sm font-semibold text-slate-50">Scan mód</div>
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
