// src/api/templateApi.ts
import { API_BASE_URL } from "@/config";
import {
  templateSchema,
  type TemplateFormValues,
} from "../pages/CardTemplatePage"; // používáme stejné místo jako drív

const BASE_URL = API_BASE_URL ?? "";

function buildHeaders(token?: string) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Nacte obsah/šablonu karty pro daného customerId.
 */
export async function fetchCardTemplate(
  customerId: string,
  token?: string
): Promise<TemplateFormValues | null> {
  if (!customerId) {
    return null;
  }

  const res = await fetch(
    `${BASE_URL}/api/customers/${encodeURIComponent(
      customerId
    )}/card-content`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );

  if (res.status === 404) {
    // customer nebo cardContent zatím neexistuje – FE použije defaulty
    return null;
  }

  if (!res.ok) {
    console.error(
      "Failed to fetch card template",
      res.status,
      await res.text()
    );
    throw new Error(`Failed to fetch card template: ${res.status}`);
  }

  const json = await res.json();
  const parsed = templateSchema.safeParse(json);
  if (!parsed.success) {
    console.error(
      "Card template from API has invalid shape:",
      parsed.error
    );
    return null;
  }

  return parsed.data;
}

/**
 * Uloží šablonu pro daného customerId.
 */
export async function saveCardTemplate(
  customerId: string,
  data: TemplateFormValues,
  token?: string
): Promise<TemplateFormValues> {
  if (!customerId) {
    throw new Error("customerId is required to save template");
  }

  const res = await fetch(
    `${BASE_URL}/api/customers/${encodeURIComponent(
      customerId
    )}/card-content`,
    {
      method: "PATCH",
      headers: buildHeaders(token),
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    console.error(
      "Failed to save card template",
      res.status,
      await res.text()
    );
    throw new Error(`Failed to save card template: ${res.status}`);
  }

  // Odpoved z backendu zatím nerešíme do detailu – jen ji prípadne logneme
  try {
    const json = await res.json();
    // Pokud bys chtel do budoucna rešit cardContent, mužeš:
    // console.log("saveCardTemplate response:", json);
  } catch {
    // žádný JSON, nevadí
  }

  // ?? Vrátíme to, co jsme poslali – to má validní tvar podle Zodu
  return data;
}
