import { API_BASE_URL } from "./config";

export type LookupResult = {
  asin: string;
  url: string;
  name: string | null;
  price: number | null;
  currency: string;
  checkedAt: string;
};

export async function lookupProduct(url: string): Promise<LookupResult> {
  const res = await fetch(`${API_BASE_URL}/api/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || `Lookup failed (${res.status})`);
  }
  return body;
}
