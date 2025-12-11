import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";

import { AppShell } from "@/components/layout/AppShell";
import { API_BASE_URL } from "@/config";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

type CardTemplate = {
  programName: string;
  headline: string;
  subheadline: string;
  customMessage: string;
  openingHours: string;
  websiteUrl: string;
  freeStampsToReward: number;
  themeVariant: "classic" | "stamps" | "minimal";
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
};

const DEFAULT_TEMPLATE: CardTemplate = {
  programName: "",
  headline: "",
  subheadline: "",
  customMessage: "",
  openingHours: "",
  websiteUrl: "",
  freeStampsToReward: 10,
  themeVariant: "classic",
  primaryColor: "#FF9900",
  secondaryColor: "#111827",
  logoUrl: "",
};

const TEMPLATE_VARIANTS: {
  key: CardTemplate["themeVariant"];
  label: string;
  description: string;
}[] = [
  {
    key: "classic",
    label: "Klasická",
    description: "Jednoduchý cistý vzhled s barvou znacky.",
  },
  {
    key: "stamps",
    label: "Razítková",
    description: "Design, který zduraznuje pocet nasbíraných razítek.",
  },
  {
    key: "minimal",
    label: "Minimalistická",
    description: "Hodne cistý, textove orientovaný vzhled.",
  },
];

export function CardTemplatePage() {
  const { getToken } = useAuth();

  const [template, setTemplate] = useState<CardTemplate>(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Nactení existující šablony z backendu
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        if (!API_BASE_URL) {
          throw new Error("Chybí konfigurace API_BASE_URL");
        }

        const token = await getToken();

        const res = await fetch(`${API_BASE_URL}/api/card-template`, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }

        const data = await res.json();

        setTemplate((prev) => ({
          ...prev,
          ...data,
          freeStampsToReward:
            typeof data.freeStampsToReward === "number"
              ? data.freeStampsToReward
              : prev.freeStampsToReward,
          themeVariant: TEMPLATE_VARIANTS.some(v => v.key === data.themeVariant)
            ? data.themeVariant
            : prev.themeVariant,
        }));
      } catch (err: any) {
        console.error("Chyba pri nacítání šablony:", err);
        setError(err?.message ?? "Neco se pokazilo pri nacítání šablony.");
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [getToken]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      if (!API_BASE_URL) {
        throw new Error("Chybí konfigurace API_BASE_URL");
      }

      const token = await getToken();

      const res = await fetch(`${API_BASE_URL}/api/card-template`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(template),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} – ${text}`);
      }

      const data = await res.json();
      setTemplate((prev) => ({
        ...prev,
        ...data,
      }));

      setSuccess("Šablona byla uložena.");
    } catch (err: any) {
      console.error("Chyba pri ukládání šablony:", err);
      setError(err?.message ?? "Neco se pokazilo pri ukládání šablony.");
    } finally {
      setSaving(false);
    }
  }

  // Jednoduchý change helper – at si nemusíš psát setTemplate všude
  function updateField<K extends keyof CardTemplate>(key: K, value: CardTemplate[K]) {
    setTemplate((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Šablona vernostní karty</h1>
        <p className="text-sm text-slate-400">
          Nastav, jak budou vypadat a fungovat karty pro tvoje zákazníky. Tato šablona
          se použije pro všechny nové karty i verejné zobrazení.
        </p>
      </div>

      {loading && (
        <p className="text-sm text-slate-400">Nacítám šablonu…</p>
      )}

      {!loading && (
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Formulár vlevo */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Nastavení obsahu a vzhledu</CardTitle>
              <CardDescription>
                Texty, barvy a typ šablony. Uložení se projeví na všech kartách.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* Základní texty */}
                <div className="space-y-3">
                  <div>
                    <FormLabel>Interní název programu</FormLabel>
                    <Input
                      placeholder="napr. Káva zdarma po 10 razítkách"
                      value={template.programName}
                      onChange={(e) => updateField("programName", e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel>Nadpis na karte</FormLabel>
                    <Input
                      placeholder="napr. Sbírej razítka a získej kávu zdarma"
                      value={template.headline}
                      onChange={(e) => updateField("headline", e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel>Podnadpis</FormLabel>
                    <Input
                      placeholder="napr. Pluxeo Coffee – Vodickova"
                      value={template.subheadline}
                      onChange={(e) => updateField("subheadline", e.target.value)}
                    />
                  </div>

                  <div>
                    <FormLabel>Text pro zákazníka</FormLabel>
                    <Textarea
                      placeholder="Krátké vysvetlení podmínek, omezení, atd."
                      value={template.customMessage}
                      onChange={(e) => updateField("customMessage", e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Pravidla programu */}
                <div className="space-y-3">
                  <div>
                    <FormLabel>Pocet razítek na odmenu</FormLabel>
                    <Input
                      type="number"
                      min={1}
                      value={template.freeStampsToReward}
                      onChange={(e) =>
                        updateField(
                          "freeStampsToReward",
                          Number(e.target.value) || 1
                        )
                      }
                      className="w-32"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <FormLabel>Otevírací doba (volitelné)</FormLabel>
                      <Input
                        placeholder="napr. Po–Pá 8:00–18:00"
                        value={template.openingHours}
                        onChange={(e) =>
                          updateField("openingHours", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <FormLabel>Web / odkaz (volitelné)</FormLabel>
                      <Input
                        placeholder="https://"
                        value={template.websiteUrl}
                        onChange={(e) =>
                          updateField("websiteUrl", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Výber šablony + barvy */}
                <div className="space-y-3">
                  <FormLabel>Typ šablony</FormLabel>
                  <RadioGroup
                    value={template.themeVariant}
                    onValueChange={(val) =>
                      updateField(
                        "themeVariant",
                        val as CardTemplate["themeVariant"]
                      )
                    }
                    className="grid gap-3 md:grid-cols-3"
                  >
                    {TEMPLATE_VARIANTS.map((variant) => (
                      <label
                        key={variant.key}
                        className="flex cursor-pointer flex-col gap-1 rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs hover:border-slate-400"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={variant.key} />
                          <span className="font-medium text-slate-50">
                            {variant.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {variant.description}
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <FormLabel>Primární barva</FormLabel>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="color"
                        className="h-9 w-12 p-1"
                        value={template.primaryColor}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                      />
                      <Input
                        value={template.primaryColor}
                        onChange={(e) =>
                          updateField("primaryColor", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <FormLabel>Sekundární barva</FormLabel>
                    <div className="mt-1 flex items-center gap-2">
                      <Input
                        type="color"
                        className="h-9 w-12 p-1"
                        value={template.secondaryColor}
                        onChange={(e) =>
                          updateField("secondaryColor", e.target.value)
                        }
                      />
                      <Input
                        value={template.secondaryColor}
                        onChange={(e) =>
                          updateField("secondaryColor", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <FormLabel>Logo URL (zatím jen URL)</FormLabel>
                    <Input
                      placeholder="https://…"
                      value={template.logoUrl}
                      onChange={(e) =>
                        updateField("logoUrl", e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Error / success */}
                {error && (
                  <p className="text-sm text-red-400 whitespace-pre-wrap">
                    {error}
                  </p>
                )}
                {success && (
                  <p className="text-sm text-emerald-400">{success}</p>
                )}

                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? "Ukládám…" : "Uložit šablonu"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Náhled vpravo */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Náhled karty</CardTitle>
              <CardDescription>
                Približný vzhled, jak se karta zobrazí zákazníkum (v aplikaci / Wallet).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplatePreview template={template} />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

type PreviewProps = {
  template: CardTemplate;
};

function TemplatePreview({ template }: PreviewProps) {
  const { themeVariant, primaryColor, secondaryColor } = template;

  const bg =
    themeVariant === "minimal"
      ? "bg-slate-900"
      : "bg-gradient-to-br";

  const gradientStyle =
    themeVariant !== "minimal"
      ? {
          backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
        }
      : {};

  return (
    <div className="flex justify-center">
      <div
        className={`w-full max-w-xs rounded-2xl p-4 text-slate-50 shadow-lg ${bg}`}
        style={gradientStyle}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-200/80">
              {template.programName || "Vernostní program"}
            </span>
            <span className="text-lg font-semibold">
              {template.headline || "Sbírej razítka a získej odmenu"}
            </span>
          </div>
          {template.logoUrl ? (
            <img
              src={template.logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-full border border-white/30 object-cover bg-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-xs">
              LOGO
            </div>
          )}
        </div>

        {template.subheadline && (
          <p className="mb-2 text-xs text-slate-100/90">
            {template.subheadline}
          </p>
        )}

        {/* "Stamps" rádek – jen vizuální */}
        <div className="mb-3 mt-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-100/80">
            Razítka do odmeny
          </p>
          <div className="flex gap-1">
            {Array.from({
              length: Math.min(template.freeStampsToReward || 10, 12),
            }).map((_, i) => (
              <div
                key={i}
                className={`h-4 flex-1 rounded-full border border-white/30 ${
                  themeVariant === "stamps"
                    ? "bg-white/10"
                    : "bg-black/15"
                }`}
              />
            ))}
          </div>
        </div>

        {template.customMessage && (
          <p className="mt-3 text-[11px] text-slate-100/90">
            {template.customMessage}
          </p>
        )}

        {(template.openingHours || template.websiteUrl) && (
          <div className="mt-3 border-t border-white/20 pt-2 text-[11px] text-slate-100/80 space-y-1">
            {template.openingHours && (
              <p>?? {template.openingHours}</p>
            )}
            {template.websiteUrl && (
              <p>?? {template.websiteUrl}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
