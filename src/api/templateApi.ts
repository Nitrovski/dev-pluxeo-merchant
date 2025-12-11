// src/api/templateApi.ts
import { templateSchema, type TemplateFormValues } from "../pages/CardTemplatePage"; // nebo odkud to exportuješ
import { API_BASE_URL } from "@/config";

const CUSTOMER_ID = import.meta.env.VITE_CUSTOMER_ID as string;
const BASE_URL = API_BASE_URL ?? "";

if (!CUSTOMER_ID) {
  console.warn(
    "VITE_CUSTOMER_ID není nastavené – nastav ho v .env (napr. VITE_CUSTOMER_ID=kavarna-123)"
  );
}

function buildHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchCardTemplate(customerId: string, token?: string) {
  const res = await fetch(`${API_BASE_URL}/api/customers/${customerId}/card-content`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    console.error("Failed to fetch card template", res.status, await res.text());
    throw new Error(`Failed to fetch card template: ${res.status}`);
  }

  const json = await res.json();
  const parsed = templateSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Card template from API has invalid shape:", parsed.error);
    return null;
  }

  return parsed.data;
}

export async function saveCardTemplate(
  data: TemplateFormValues,
  token?: string
): Promise<TemplateFormValues> {
  if (!CUSTOMER_ID) {
    throw new Error("VITE_CUSTOMER_ID is not set");
  }

  const res = await fetch(
    `${BASE_URL}/api/customers/${encodeURIComponent(
      CUSTOMER_ID
    )}/card-content`,
    {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    console.error("Failed to save card template", res.status, await res.text());
    throw new Error(`Failed to save card template: ${res.status}`);
  }

  const json = await res.json();
  const parsed = templateSchema.safeParse(json);
  if (!parsed.success) {
    console.error("Saved card template from API has invalid shape:", parsed.error);
    return data; // radši vrátíme puvodní než spadnout
  }

  return parsed.data;
}
