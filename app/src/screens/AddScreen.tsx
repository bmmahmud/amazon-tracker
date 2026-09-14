import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { lookupProduct } from "../api";
import { upsertProduct } from "../storage";
import { parseManualLine, manualId } from "../manualParse";
import { Product } from "../types";

type Props = {
  onAdded: (products: Product[]) => void;
};

type Mode = "url" | "manual";
type LineStatus = { line: string; status: "pending" | "ok" | "error"; message?: string };

export default function AddScreen({ onAdded }: Props) {
  const [mode, setMode] = useState<Mode>("url");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<LineStatus[]>([]);

  async function handleAddFromUrls(lines: string[]) {
    setResults(lines.map((line) => ({ line, status: "pending" })));
    let latest: Product[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      try {
        const result = await lookupProduct(line);
        const product: Product = {
          asin: result.asin,
          url: result.url,
          name: result.name || "(unknown name)",
          price: result.price,
          currency: result.currency,
          checkedAt: result.checkedAt,
          addedAt: new Date().toISOString(),
        };
        latest = await upsertProduct(product);
        setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "ok" } : r)));
      } catch (err: any) {
        setResults((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "error", message: err.message } : r))
        );
      }
    }
    return latest;
  }

  async function handleAddManual(lines: string[]) {
    setResults(lines.map((line) => ({ line, status: "pending" })));
    let latest: Product[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parsed = parseManualLine(line);
      if (!parsed.ok) {
        setResults((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "error", message: parsed.error } : r))
        );
        continue;
      }
      const product: Product = {
        asin: manualId(parsed.name),
        url: "",
        name: parsed.name,
        price: parsed.price,
        currency: parsed.currency,
        checkedAt: new Date().toISOString(),
        addedAt: new Date().toISOString(),
      };
      latest = await upsertProduct(product);
      setResults((prev) => prev.map((r, idx) => (idx === i ? { ...r, status: "ok" } : r)));
    }
    return latest;
  }

  async function handleAdd() {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setBusy(true);
    const latest = mode === "url" ? await handleAddFromUrls(lines) : await handleAddManual(lines);
    setBusy(false);
    if (latest.length > 0) onAdded(latest);
    setText("");
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.modeSwitch}>
        <Pressable
          style={[styles.modeButton, mode === "url" && styles.modeButtonActive]}
          onPress={() => setMode("url")}
        >
          <Text style={[styles.modeText, mode === "url" && styles.modeTextActive]}>
            From URL (needs server)
          </Text>
        </Pressable>
        <Pressable
          style={[styles.modeButton, mode === "manual" && styles.modeButtonActive]}
          onPress={() => setMode("manual")}
        >
          <Text style={[styles.modeText, mode === "manual" && styles.modeTextActive]}>
            Manual (no server)
          </Text>
        </Pressable>
      </View>

      <Text style={styles.label}>
        {mode === "url"
          ? "Paste Amazon product URLs (one per line)"
          : "Paste 'Name - Price' (one per line)"}
      </Text>
      <TextInput
        style={styles.input}
        multiline
        placeholder={
          mode === "url"
            ? "https://www.amazon.com/dp/XXXXXXXXXX\nhttps://www.amazon.com/dp/YYYYYYYYYY"
            : "Echo Dot (5th Gen) - $29.99\nKindle Paperwhite - $139.99"
        }
        value={text}
        onChangeText={setText}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!busy}
      />
      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        onPress={handleAdd}
        disabled={busy || text.trim().length === 0}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add to list</Text>
        )}
      </Pressable>

      {results.length > 0 && (
        <View style={styles.results}>
          {results.map((r, i) => (
            <Text
              key={i}
              style={[
                styles.resultLine,
                r.status === "ok" && styles.resultOk,
                r.status === "error" && styles.resultError,
              ]}
              numberOfLines={1}
            >
              {r.status === "pending" ? "…" : r.status === "ok" ? "✓" : "✗"} {r.line}
              {r.message ? ` — ${r.message}` : ""}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  modeSwitch: { flexDirection: "row", gap: 8, marginBottom: 4 },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  modeButtonActive: { backgroundColor: "#232F3E", borderColor: "#232F3E" },
  modeText: { fontSize: 12, color: "#555", fontWeight: "600" },
  modeTextActive: { color: "#fff" },
  label: { fontSize: 14, color: "#555", marginBottom: 4 },
  input: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#FF9900",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  results: { marginTop: 16, gap: 4 },
  resultLine: { fontSize: 12, color: "#555" },
  resultOk: { color: "#2e7d32" },
  resultError: { color: "#c62828" },
});
