const express = require("express");
const cors = require("cors");
const { fetchProduct } = require("./lib/amazon");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

// POST { url } -> { asin, url, name, price, currency, checkedAt }
// Used both for "add product" (first lookup) and "refresh price" (re-lookup).
app.post("/api/lookup", async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== "string") {
    return res.status(400).json({ error: "Body must include a 'url' string" });
  }

  try {
    const product = await fetchProduct(url);
    res.json(product);
  } catch (err) {
    console.error(`[lookup failed] ${url}:`, err.message);
    res
      .status(err.status || 502)
      .json({ error: err.message || "Failed to fetch product" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`amazon-tracker server listening on http://0.0.0.0:${PORT}`);
});
