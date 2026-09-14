import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "./types";

const KEY = "amazon-tracker:products";

export async function loadProducts(): Promise<Product[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Product[];
  } catch {
    return [];
  }
}

export async function saveProducts(products: Product[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(products));
}

// Adds or overwrites (by ASIN) a product, then persists the whole list.
export async function upsertProduct(product: Product): Promise<Product[]> {
  const current = await loadProducts();
  const idx = current.findIndex((p) => p.asin === product.asin);
  const next = [...current];
  if (idx >= 0) {
    next[idx] = { ...next[idx], ...product };
  } else {
    next.push(product);
  }
  await saveProducts(next);
  return next;
}

export async function removeProduct(asin: string): Promise<Product[]> {
  const current = await loadProducts();
  const next = current.filter((p) => p.asin !== asin);
  await saveProducts(next);
  return next;
}
