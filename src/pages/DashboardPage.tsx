import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/hooks/useDashboard";
import {
  CreditCard,
  ScanLine,
  Users,
  ArrowRight,
  ChevronRight,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type KPI = {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  series?: number[];
  icon: React.ReactNode;
};

type ActivityItem = {
  type: "stamp" | "reward" | "new_wallet" | "note" | "card_created";
  title: string;
  meta: string;
  ts?: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function makeBaseline(series: number[], baseline = 1) {
  // když je všechno 0 → ať je aspoň vidět “živá” čára (ne klamavě, je to baseline)
  const allZero = series.length > 0 && series.every((x) => x === 0);
  if (!allZero) return series;
  return series.map(() => baseline);
}

function Sparkline({ series, id }: { series: number[]; id: string }) {
  const w = 170;
  const h = 46;
  const pad = 6;

  const safeRaw = series?.length >= 2 ? series : [0, ...(series ?? [])];
  const safe = makeBaseline(safeRaw, 1);

  const min = Math.min(...safe);
  const max = Math.max(...safe);
  const span = Math.max(1, max - min);

  const points = safe.map((v, i) => {
    const x = (i / (safe.length - 1)) * (w - pad * 2) + pad;
    const y = h - ((v - min) / span) * (h - pad * 2) - pad;
    return { x, y };
  });

  const pts = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

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
          <stop offset="0%" stopColor="rgba(56,189,248,0.95)" />
          <stop offset="50%" stopColor="rgba(99,102,241,0.95)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0.95)" />
        </linearGradient>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.28)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0)" />
        </linearGradient>
      </defs>

      {/* jemná mřížka */}
      <g opacity="0.35">
        <path d={`M ${pad} ${h - pad} H ${w - pad}`} stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
        <path d={`M ${pad} ${pad} H ${w - pad}`} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />
      </g>

      <path d={area} fill={`url(#${fillId})`} />
      <polyline
        fill="none"
        stroke={`url(#${lineId})`}
        strokeWidth="2.25"
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
      <CardContent className="relative p-5 min-h-[140px]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        </div>

        <div className="absolute right-4 top-4 rounded-xl border border-slate-800 bg-slate-900/45 p-2 text-slate-100">
          {kpi.icon}
        </div>

        {/* sparkline */}
        {kpi.series && (
          <div className="absolute right-3 bottom-3 pointer-events-none opacity-95 drop-shadow-[0_0_18px_rgba(99,102,241,0.35)]">
            <Sparkline series={kpi.series} id={sparkId} />
          </div>
        )}

        {/* text */}
        <div className="relative space-y-2 pr-44 pb-10">
          <div className="text-sm text-slate-400">{kpi.label}</div>
          <div className="text-3xl font-semibold tracking-tight text-slate-50">{kpi.value}</div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
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
              <span className="inline-flex items-center rounded-full border border-slate-800 bg-slate-900/35 px-2 py-0.5 text-xs text-slate-200">
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
      icon: <Sparkles className="h-3.5 w-3.5" />,
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
    card_created: {
      label: "Nová karta",
      icon: <CreditCard className="h-3.5 w-3.5" />,
      cls: "border-indigo-500/30 text-indigo-200 bg-indigo-500/10",
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
    ) : type === "card_created" || type === "new_wallet" ? (
      <CreditCard className="h-4 w-4" />
    ) : (
      <Sparkles className="h-4 w-4" />
    );

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-2 text-slate-100">
      {icon}
    </div>
  );
}

function BigLinesChart({
  title,
  subtitle,
  aLabel,
  aSeries,
  bLabel,
  bSeries,
}: {
  title: string;
  subtitle: string;
  aLabel: string;
  aSeries: number[];
  bLabel: string;
  bSeries: number[];
}) {
  const w = 900;
  const h = 220;
  const padX = 18;
  const padY = 18;

  const a = makeBaseline(aSeries, 1);
  const b = makeBaseline(bSeries, 1);

  const maxV = Math.max(1, ...a, ...b);

  const toPoints = (series: number[]) =>
    series.map((v, i) => {
      const x = (i / (series.length - 1)) * (w - padX * 2) + padX;
      const y = h - padY - (clamp(v, 0, maxV) / maxV) * (h - padY * 2);
      return { x, y };
    });

  const ptsA = toPoints(a).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const ptsB = toPoints(b).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  const areaA = (() => {
    const p = toPoints(a);
    return [
      `M ${p[0].x.toFixed(1)} ${h - padY}`,
      ...p.map((x) => `L ${x.x.toFixed(1)} ${x.y.toFixed(1)}`),
      `L ${p[p.length - 1].x.toFixed(1)} ${h - padY}`,
      "Z",
    ].join(" ");
  })();

  return (
    <Card className="bg-slate-950/60 border-slate-800 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-200" />
          {title}
        </CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/35 px-3 py-1 text-slate-200">
            <span className="h-2 w-2 rounded-full bg-sky-400/90" />
            {aLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/35 px-3 py-1 text-slate-200">
            <span className="h-2 w-2 rounded-full bg-indigo-400/90" />
            {bLabel}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="absolute -right-24 -bottom-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
          </div>

          <svg viewBox={`0 0 ${w} ${h}`} className="relative block h-[220px] w-full">
            <defs>
              <linearGradient id="bigLineA" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(56,189,248,0.95)" />
                <stop offset="100%" stopColor="rgba(34,211,238,0.95)" />
              </linearGradient>
              <linearGradient id="bigLineB" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(99,102,241,0.95)" />
                <stop offset="100%" stopColor="rgba(168,85,247,0.95)" />
              </linearGradient>
              <linearGradient id="bigFillA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(56,189,248,0.22)" />
                <stop offset="100%" stopColor="rgba(56,189,248,0)" />
              </linearGradient>
            </defs>

            {/* grid */}
            {Array.from({ length: 4 }).map((_, i) => {
              const y = padY + (i / 3) * (h - padY * 2);
              return (
                <line
                  key={i}
                  x1={padX}
                  x2={w - padX}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.18)"
                  strokeWidth="1"
                />
              );
            })}

            {/* area + lines */}
            <path d={areaA} fill="url(#bigFillA)" />
            <polyline points={ptsA} fill="none" stroke="url(#bigLineA)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={ptsB} fill="none" stroke="url(#bigLineB)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* baseline */}
            <line
              x1={padX}
              x2={w - padX}
              y1={h - padY}
              y2={h - padY}
              stroke="rgba(148,163,184,0.28)"
              strokeWidth="1"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/25 px-4 py-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl border border-slate-800 bg-slate-900/45" />
            <div className="space-y-2">
              <div className="h-3 w-48 rounded bg-slate-800/60" />
              <div className="h-3 w-64 rounded bg-slate-800/40" />
            </div>
          </div>
          <div className="h-7 w-16 rounded-full border border-slate-800 bg-slate-900/30" />
        </div>
      ))}
    </div>
  );
}

export function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();

  // Event-based
  const stampsDaily = data?.series?.stampsDaily?.map((x: any) => x.count) ?? new Array(14).fill(0);

  // Card-based (držet nové karty)
  const newCardsDaily = data?.series?.newCardsDaily?.map((x: any) => x.count) ?? new Array(14).fill(0);

  const kpis: KPI[] = [
    {
      label: "Aktivní karty",
      value: loading ? "…" : String(data?.kpis?.activeCards ?? 0),
      hint: "všechny karty",
      series: newCardsDaily,
      icon: <CreditCard className="h-5 w-5" />,
    },
    {
      label: "Razítka dnes",
      value: loading ? "…" : String(data?.kpis?.stampsToday ?? 0),
      hint: "dnešní den",
      series: stampsDaily,
      icon: <ScanLine className="h-5 w-5" />,
    },
    {
      label: "Celkem razítek",
      value: loading ? "…" : String(data?.kpis?.totalStamps ?? 0),
      hint: "stav ze všech karet",
      series: stampsDaily,
      icon: <ScanLine className="h-5 w-5" />,
    },
    {
      label: "Nové karty",
      value: loading ? "…" : String(data?.kpis?.newCards7d ?? 0),
      hint: "posledních 7 dní",
      series: newCardsDaily,
      icon: <Users className="h-5 w-5" />,
    },
  ];

  const activity: ActivityItem[] =
    data?.activity?.map((a: any) => ({
      type: a.type ?? "note",
      title: a.title ?? "Aktivita",
      meta: a.meta ?? "",
      ts: a.ts,
    })) ?? [];

  return (
    <AppShell>
      {/* Background gradient */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-[-20%] top-[-30%] h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute right-[-15%] top-[0%] h-[480px] w-[480px] rounded-full bg-sky-500/10 blur-3xl" />
          <div className="absolute left-[10%] bottom-[-40%] h-[520px] w-[520px] rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-slate-50">Dashboard</h1>
              <p className="text-sm text-slate-400">Přehled výkonu a poslední aktivita.</p>
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

          {/* Error */}
          {error && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/25 px-4 py-3">
              <div className="text-sm text-red-300">Dashboard se nepodařilo načíst: {error}</div>
              <Button variant="secondary" size="sm" onClick={refresh}>
                Zkusit znovu
              </Button>
            </div>
          )}

          {/* KPI grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, idx) => (
              <StatCard key={kpi.label} kpi={kpi} sparkId={`kpi-${idx}`} />
            ))}
          </div>

          {/* Big chart */}
          <BigLinesChart
            title="Vývoj za posledních 14 dní"
            subtitle="Razítka (eventy) vs. nové karty (registrace)."
            aLabel="Razítka"
            aSeries={stampsDaily}
            bLabel="Nové karty"
            bSeries={newCardsDaily}
          />

          {/* Lower grid */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Activity */}
            <Card className="lg:col-span-2 bg-slate-950/60 border-slate-800 overflow-hidden">
              <CardHeader>
                <CardTitle>Aktivita</CardTitle>
                <CardDescription>Poslední události (event log).</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3">
                {loading ? (
                  <ActivitySkeleton />
                ) : activity.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/25 p-5">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-2 text-slate-100">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-50">Zatím tu nic není</div>
                        <div className="text-xs text-slate-400">
                          Jakmile vytvoříš kartu nebo přidáš razítko, uvidíš to tady.
                        </div>
                        <div className="pt-3 flex gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <a href="/cards">Otevřít karty</a>
                          </Button>
                          <Button size="sm" variant="secondary" disabled title="Brzy">
                            Spustit scan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  activity.map((a, idx) => (
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
                        className="inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/30 px-3 py-1 text-xs text-slate-200 opacity-90 hover:opacity-100"
                        disabled
                        title="Brzy"
                      >
                        detail <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
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
      </div>
    </AppShell>
  );
}
