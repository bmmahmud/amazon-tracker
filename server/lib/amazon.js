const axios = require("axios");
const cheerio = require("cheerio");

// Pulls a 10-char ASIN out of pretty much any Amazon product URL shape
// (/dp/XXXX, /gp/product/XXXX, ?ASIN=XXXX, short amzn.to links after redirect, etc).
function extractAsin(rawUrl) {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
    /[?&]asin=([A-Z0-9]{10})/i,
  ];
  for (const re of patterns) {
    const m = rawUrl.match(re);
    if (m) return m[1].toUpperCase();
  }
  return null;
}

// Builds a clean, canonical product URL from an ASIN so future lookups are stable
// even if the pasted URL had tracking params / a different domain path shape.
function canonicalUrl(asin, domain = "www.amazon.com") {
  return `https://${domain}/dp/${asin}`;
}

function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^0-9.,]/g, "").replace(/,/g, "");
  const value = parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
};

async function fetchProduct(url) {
  const asin = extractAsin(url);
  if (!asin) {
    const err = new Error("Could not find an ASIN in that URL");
    err.status = 400;
    throw err;
  }

  const domainMatch = url.match(/https?:\/\/([^/]+)/i);
  const domain = domainMatch ? domainMatch[1] : "www.amazon.com";
  const targetUrl = canonicalUrl(asin, domain);

  const { data: html } = await axios.get(targetUrl, {
    headers: HEADERS,
    timeout: 15000,
  });

  const $ = cheerio.load(html);

  const name =
    $("#productTitle").text().trim() ||
    $("meta[name='title']").attr("content") ||
    $("title").text().trim() ||
    null;

  // Amazon renders price in several possible spots depending on layout/A-B test.
  const priceCandidates = [
    $(".a-price .a-offscreen").first().text(),
    $("#corePrice_feature_div .a-offscreen").first().text(),
    $("#priceblock_ourprice").text(),
    $("#priceblock_dealprice").text(),
    $("span.a-price-whole").first().text(),
  ];

  let price = null;
  for (const candidate of priceCandidates) {
    price = parsePrice(candidate);
    if (price !== null) break;
  }

  const currencySymbolMatch = priceCandidates.find(Boolean)?.match(/[^\d.,\s]+/);
  const currency = currencySymbolMatch ? currencySymbolMatch[0] : "$";

  return {
    asin,
    url: targetUrl,
    name,
    price,
    currency,
    checkedAt: new Date().toISOString(),
  };
}

module.exports = { extractAsin, canonicalUrl, parsePrice, fetchProduct };
