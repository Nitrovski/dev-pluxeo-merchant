import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/AppShell";
import { useCustomer } from "@/hooks/useCustomer";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

import {
  fetchCardTemplate,
  saveCardTemplate,
} from "@/api/templateApi";

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

// --- ZOD SCHÉMA ---

export const templateSchema = z.object({
  programName: z
    .string()
    .max(100, "Maximálne 100 znaku")
    .optional(),

  headline: z
    .string()
    .min(1, "Nadpis je povinný")
    .max(120, "Maximálne 120 znaku"),

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

  websiteUrl: z
    .union([z.string().url("Musí být platná URL"), z.literal("")])
    .optional(),

  freeStampsToReward: z.coerce
    .number()
    .int("Musí být celé císlo")
    .min(1, "Minimálne 1 razítko")
    .max(50, "Maximálne 50 razítek"),

  themeVariant: z.enum(["classic", "stamps", "minimal"]),

  primaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Zadej HEX barvu ve formátu #RRGGBB"),

  secondaryColor: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, "Zadej HEX barvu ve formátu #RRGGBB"),

  logoUrl: z
    .union([z.string().url("Musí být platná URL"), z.literal("")])
    .optional(),
});

// typ formuláre
export type TemplateFormValues = z.input<typeof templateSchema>;

// --- DEFAULTNÍ HODNOTY ---

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

   const customerId = useCustomer();
   
  // Nactení existující šablony z backendu pres templateApi
  useEffect(() => {
    async function loadTemplate() {
      if (!customerId) return;

      try {
        setLoading(true);
        setServerError(null);

        const token = await getToken();

        const data = await fetchCardTemplate(customerId, token);

        if (data) {
          form.reset({ ...DEFAULT_VALUES, ...data });
        } else {
          form.reset(DEFAULT_VALUES);
        }

      } catch (err: any) {
        console.error("Chyba pri nacítání šablony:", err);
        setServerError(err?.message || "Nelze nacíst šablonu.");
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();

  }, [customerId]);


  async function onSubmit(values: TemplateFormValues) {
    try {
      setServerError(null);
      setServerSuccess(null);

      const token = await getToken();
      const saved = await saveCardTemplate(values, token ?? undefined);

      form.reset({ ...values, ...saved });
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
                              // explicitne premapujeme FieldValues ? props pro <input>
                              name={field.name}
                              ref={field.ref}
                              onBlur={field.onBlur}
                              onChange={(e) => field.onChange(e.target.value)}
                              value={
                                field.value as number | string | undefined
                              }
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
                              <Input placeholder="https://…" {...field} />
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

                  <Button
                    type="submit"
                    size="sm"
                    disabled={form.formState.isSubmitting}
                  >
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
                Približný vzhled, jak se karta zobrazí zákazníkum (v aplikaci /
                Wallet).
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
            {(() => {
              const raw = values.freeStampsToReward;
              const parsed =
                typeof raw === "number" ? raw : Number(raw ?? 10);

              const safeCount =
                Number.isFinite(parsed) && parsed > 0 ? parsed : 10;

              const length = Math.min(safeCount, 12);

              return Array.from({ length }).map((_, i) => (
                <div
                  key={i}
                  className={`h-4 flex-1 rounded-full border border-white/30 ${
                    values.themeVariant === "stamps"
                      ? "bg-white/10"
                      : "bg-black/15"
                  }`}
                />
              ));
            })()}
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
