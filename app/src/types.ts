export type Product = {
  asin: string;
  url: string;
  name: string;
  price: number | null;
  currency: string;
  checkedAt: string; // ISO timestamp of last successful price check
  addedAt: string; // ISO timestamp of when it was first added
};
