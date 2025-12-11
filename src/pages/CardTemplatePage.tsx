import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { Label } from "@/components/ui/label";

const TEMPLATE_VARIANTS = [
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
] as const;

const templateSchema = z.object({
  // interní název, klidne prázdný nebo undefined
  programName: z
    .string()
    .max(100, "Maximálne 100 znaku")
    .optional(),

  // MUSÍ být vyplnené
  headline: z
    .string()
    .min(1, "Nadpis je povinný")
    .max(120, "Maximálne 120 znaku"),

  // nepovinné, muže být prázdné nebo undefined
  subheadline: z
    .string()
    .max(160, "Maximálne 160 znaku")
    .optional(),

  customMessage: z
    .string()
    .max(500, "Maximálne 500 znaku")
    .optional(),

  openingHours: z
    .string()
    .max(120, "Maximálne 120 znaku")
    .optional(),

  // muže být: "" (prázdný) nebo validní URL
  websiteUrl: z
    .union([z.string().url("Musí být platná URL"), z.literal("")])
    .optional(),

  // input posílá string, Zod to prevede na number
  freeStampsToReward: z.coerce
    .number()
    .int("Musí být celé císlo")
    .min(1, "Minimálne 1 razítko")
    .max(50, "Maximálne 50 razítek"),

  // výber ze trí možností
  themeVariant: z.enum(["classic", "stamps", "minimal"]),

  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Zadej HEX barvu ve formátu #RRGGBB"),

  secondaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Zadej HEX barvu ve formátu #RRGGBB"),

  // muže být "" nebo validní URL
  logoUrl: z
    .union([z.string().url("Musí být platná URL"), z.literal("")])
    .optional(),
});


type TemplateFormValues = z.infer<typeof templateSchema>;

const DEFAULT_VALUES: TemplateFormValues = {
  programName: "",
  headline: "Sbírej razítka a získej kávu zdarma",
  subheadline: "Pluxeo Coffee – tvoje oblíbená kavárna",
  customMessage: "",
  openingHours: "",
  websiteUrl: "",
  freeStampsToReward: 10,
  themeVariant: "classic",
  primaryColor: "#FF9900",
  secondaryColor: "#111827",
  logoUrl: "",
};

export function CardTemplatePage() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverSuccess, setServerSuccess] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onBlur",
  });

  // Nactení existující šablony z backendu
  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true);
        setServerError(null);
        setServerSuccess(null);

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

        const merged: TemplateFormValues = {
          ...DEFAULT_VALUES,
          ...data,
          freeStampsToReward:
            typeof data.freeStampsToReward === "number"
              ? data.freeStampsToReward
              : DEFAULT_VALUES.freeStampsToReward,
          themeVariant: TEMPLATE_VARIANTS.some(
            (v) => v.key === data.themeVariant
          )
            ? data.themeVariant
            : DEFAULT_VALUES.themeVariant,
        };

        form.reset(merged);
      } catch (err: any) {
        console.error("Chyba pri nacítání šablony:", err);
        setServerError(
          err?.message ?? "Neco se pokazilo pri nacítání šablony."
        );
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [getToken, form]);

  async function onSubmit(values: TemplateFormValues) {
    try {
      setServerError(null);
      setServerSuccess(null);

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
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} – ${text}`);
      }

      const data = await res.json();

      form.reset({
        ...values,
        ...data,
      });

      setServerSuccess("Šablona byla úspešne uložena.");
    } catch (err: any) {
      console.error("Chyba pri ukládání šablony:", err);
      setServerError(
        err?.message ?? "Neco se pokazilo pri ukládání šablony."
      );
    }
  }

  const previewValues = form.watch();

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Šablona vernostní karty</h1>
        <p className="text-sm text-slate-400">
          Nastav, jak budou vypadat a fungovat karty pro tvoje zákazníky. Tato
          šablona se použije pro všechny nové karty i verejné zobrazení.
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
              <CardTitle>Nastavení obsahu a pravidel</CardTitle>
              <CardDescription>
                Texty, pravidla programu a vzhled karty. Uložení se projeví
                všude, kde se karta zobrazuje.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  className="space-y-6"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {/* Sekce: Texty */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-100">
                      Texty na karte
                    </h2>
                    <FormField
                      control={form.control}
                      name="programName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interní název programu</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="napr. Káva zdarma po 10 razítkách"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="headline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nadpis na karte</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="napr. Sbírej razítka a získej kávu zdarma"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subheadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Podnadpis</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="napr. Pluxeo Coffee – Vodickova"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text pro zákazníka</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Krátké vysvetlení podmínek, omezení, atd."
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sekce: Pravidla */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-100">
                      Pravidla vernostního programu
                    </h2>

                    <FormField
                      control={form.control}
                      name="freeStampsToReward"
                      render={({ field }) => (
                        <FormItem className="max-w-[160px]">
                          <FormLabel>Pocet razítek na odmenu</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={50}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="openingHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Otevírací doba (volitelné)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="napr. Po–Pá 8:00–18:00"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Web / odkaz (volitelné)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://…" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Sekce: Typ šablony */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-100">
                      Typ šablony
                    </h2>
                    <FormField
                      control={form.control}
                      name="themeVariant"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid gap-3 md:grid-cols-3"
                            >
                              {TEMPLATE_VARIANTS.map((variant) => (
                                <label
                                  key={variant.key}
                                  className={`flex cursor-pointer flex-col gap-1 rounded-lg border bg-slate-900/60 p-3 text-xs hover:border-slate-400 ${
                                    field.value === variant.key
                                      ? "border-slate-200"
                                      : "border-slate-700"
                                  }`}
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Sekce: Branding / barvy / logo */}
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-100">
                      Branding a barvy
                    </h2>
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primární barva</FormLabel>
                            <div className="mt-1 flex items-center gap-2">
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="h-9 w-12 cursor-pointer rounded-md border border-slate-700 bg-slate-950 p-1"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                  <Input {...field} />
                                </div>
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sekundární barva</FormLabel>
                            <div className="mt-1 flex items-center gap-2">
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    className="h-9 w-12 cursor-pointer rounded-md border border-slate-700 bg-slate-950 p-1"
                                    value={field.value}
                                    onChange={(e) =>
                                      field.onChange(e.target.value)
                                    }
                                  />
                                  <Input {...field} />
                                </div>
                              </FormControl>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL (zatím jen URL)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://…"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Globální hlášky */}
                  {serverError && (
                    <p className="text-sm text-red-400 whitespace-pre-wrap">
                      {serverError}
                    </p>
                  )}
                  {serverSuccess && (
                    <p className="text-sm text-emerald-400">
                      {serverSuccess}
                    </p>
                  )}

                  <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Ukládám…" : "Uložit šablonu"}
                  </Button>
                </form>
              </Form>
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
              <TemplatePreview values={previewValues} />
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}

function TemplatePreview({ values }: { values: TemplateFormValues }) {
  const { themeVariant, primaryColor, secondaryColor } = values;

  const isMinimal = themeVariant === "minimal";

  const style = !isMinimal
    ? {
        backgroundImage: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }
    : {};

  return (
    <div className="flex justify-center">
      <div
        className="w-full max-w-xs rounded-2xl p-4 text-slate-50 shadow-lg bg-slate-900"
        style={style}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-slate-200/80">
              {values.programName || "Vernostní program"}
            </span>
            <span className="text-lg font-semibold">
              {values.headline || "Sbírej razítka a získej odmenu"}
            </span>
          </div>
          {values.logoUrl ? (
            <img
              src={values.logoUrl}
              alt="Logo"
              className="h-10 w-10 rounded-full border border-white/30 object-cover bg-white/10"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-black/20 text-xs">
              LOGO
            </div>
          )}
        </div>

        {values.subheadline && (
          <p className="mb-2 text-xs text-slate-100/90">
            {values.subheadline}
          </p>
        )}

        <div className="mb-3 mt-3">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-slate-100/80">
            Razítka do odmeny
          </p>
          <div className="flex gap-1">
            {Array.from({
              length: Math.min(values.freeStampsToReward || 10, 12),
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

        {values.customMessage && (
          <p className="mt-3 text-[11px] text-slate-100/90">
            {values.customMessage}
          </p>
        )}

        {(values.openingHours || values.websiteUrl) && (
          <div className="mt-3 border-t border-white/20 pt-2 text-[11px] text-slate-100/80 space-y-1">
            {values.openingHours && <p>?? {values.openingHours}</p>}
            {values.websiteUrl && <p>?? {values.websiteUrl}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
