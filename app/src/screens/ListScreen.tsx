import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import { Product } from "../types";
import { lookupProduct } from "../api";
import { removeProduct, saveProducts } from "../storage";

type Props = {
  products: Product[];
  onChange: (products: Product[]) => void;
};

export default function ListScreen({ products, onChange }: Props) {
  const [refreshingAsin, setRefreshingAsin] = useState<string | null>(null);
  const [refreshingAll, setRefreshingAll] = useState(false);

  async function refreshOne(product: Product) {
    setRefreshingAsin(product.asin);
    try {
      const result = await lookupProduct(product.url);
      const updated = products.map((p) =>
        p.asin === product.asin
          ? {
              ...p,
              price: result.price,
              name: result.name || p.name,
              checkedAt: result.checkedAt,
            }
          : p
      );
      onChange(updated);
      await saveProducts(updated);
    } catch (err: any) {
      Alert.alert("Refresh failed", err.message);
    } finally {
      setRefreshingAsin(null);
    }
  }

  async function refreshAll() {
    setRefreshingAll(true);
    let current = [...products];
    for (const product of products) {
      if (!product.url) continue; // manually-added item, nothing to re-fetch
      try {
        const result = await lookupProduct(product.url);
        current = current.map((p) =>
          p.asin === product.asin
            ? {
                ...p,
                price: result.price,
                name: result.name || p.name,
                checkedAt: result.checkedAt,
              }
            : p
        );
        onChange(current);
      } catch {
        // keep going even if one item fails
      }
    }
    await saveProducts(current);
    setRefreshingAll(false);
  }

  async function handleRemove(asin: string) {
    const next = await removeProduct(asin);
    onChange(next);
  }

  if (products.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No products tracked yet. Add some from the Add tab.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Pressable
        style={[styles.refreshAllButton, refreshingAll && styles.buttonDisabled]}
        onPress={refreshAll}
        disabled={refreshingAll}
      >
        {refreshingAll ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.refreshAllText}>Refresh all prices</Text>
        )}
      </Pressable>

      <FlatList
        data={products}
        keyExtractor={(item) => item.asin}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        refreshControl={
          <RefreshControl refreshing={refreshingAll} onRefresh={refreshAll} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable disabled={!item.url} onPress={() => item.url && Linking.openURL(item.url)}>
              <Text style={styles.name} numberOfLines={2}>
                {item.name}
              </Text>
            </Pressable>
            <Text style={styles.price}>
              {item.price !== null ? `${item.currency}${item.price.toFixed(2)}` : "Price unavailable"}
            </Text>
            <Text style={styles.meta}>
              {item.url
                ? `Last checked: ${new Date(item.checkedAt).toLocaleString()}`
                : "Manually added — no live price checks"}
            </Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.smallButton, !item.url && styles.buttonDisabled]}
                onPress={() => refreshOne(item)}
                disabled={!item.url || refreshingAsin === item.asin}
              >
                {refreshingAsin === item.asin ? (
                  <ActivityIndicator size="small" />
                ) : (
                  <Text style={styles.smallButtonText}>Refresh</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.smallButton, styles.removeButton]}
                onPress={() =>
                  Alert.alert("Remove", `Remove "${item.name}" from your list?`, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => handleRemove(item.asin) },
                  ])
                }
              >
                <Text style={[styles.smallButtonText, styles.removeButtonText]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: "#777", textAlign: "center" },
  refreshAllButton: {
    backgroundColor: "#232F3E",
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.5 },
  refreshAllText: { color: "#fff", fontWeight: "600" },
  card: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  name: { fontSize: 15, fontWeight: "600", color: "#111" },
  price: { fontSize: 18, fontWeight: "700", color: "#B12704" },
  meta: { fontSize: 12, color: "#888" },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  smallButton: {
    backgroundColor: "#FF9900",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  smallButtonText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  removeButton: { backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#ddd" },
  removeButtonText: { color: "#c62828" },
});
