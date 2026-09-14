// Parses lines like "Echo Dot - $29.99" or "Echo Dot: 29.99" with no network
// call, so the app is usable without the backend server running.
export type ManualParseResult =
  | { ok: true; name: string; price: number | null; currency: string }
  | { ok: false; error: string };

export function parseManualLine(line: string): ManualParseResult {
  const trimmed = line.trim();
  if (!trimmed) return { ok: false, error: "Empty line" };

  const match = trimmed.match(/^(.*?)[\s]*[-:–][\s]*([^\d]*)(\d[\d,]*\.?\d*)\s*$/);
  if (!match) {
    return { ok: false, error: "Expected 'Name - Price', e.g. 'Echo Dot - $29.99'" };
  }

  const name = match[1].trim();
  const currency = match[2].trim() || "$";
  const price = parseFloat(match[3].replace(/,/g, ""));

  if (!name) return { ok: false, error: "Missing product name" };
  if (!Number.isFinite(price)) return { ok: false, error: "Missing/invalid price" };

  return { ok: true, name, price, currency };
}

// Stable-ish id for manually added items (no ASIN available).
export function manualId(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return `manual-${Math.abs(hash)}-${Date.now()}`;
}
