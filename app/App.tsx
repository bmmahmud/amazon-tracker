import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet, StatusBar } from "react-native";
import AddScreen from "./src/screens/AddScreen";
import ListScreen from "./src/screens/ListScreen";
import { loadProducts } from "./src/storage";
import { Product } from "./src/types";

type Tab = "list" | "add";

export default function App() {
  const [tab, setTab] = useState<Tab>("list");
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadProducts().then((p) => {
      setProducts(p);
      setLoaded(true);
    });
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Amazon Price Tracker</Text>
      </View>

      <View style={styles.body}>
        {!loaded ? null : tab === "list" ? (
          <ListScreen products={products} onChange={setProducts} />
        ) : (
          <AddScreen
            onAdded={(next) => {
              setProducts(next);
              setTab("list");
            }}
          />
        )}
      </View>

      <View style={styles.tabBar}>
        <Pressable style={styles.tab} onPress={() => setTab("list")}>
          <Text style={[styles.tabText, tab === "list" && styles.tabTextActive]}>
            My List{products.length > 0 ? ` (${products.length})` : ""}
          </Text>
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setTab("add")}>
          <Text style={[styles.tabText, tab === "add" && styles.tabTextActive]}>Add</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#232F3E" },
  body: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: "center" },
  tabText: { fontSize: 15, color: "#888" },
  tabTextActive: { color: "#FF9900", fontWeight: "700" },
});
