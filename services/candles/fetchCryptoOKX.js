// fitxer fetchCryptoOKX.js

import axios from "axios";

const API_OKX = process.env.API_URL;

// Normalitzar timestamp
function normalizeTimestamp(raw) {
  if (!raw || typeof raw !== "number") return null;
  if (raw < 1600000000000) return null; // ms (2020+)
  return raw;
}

// Format intern
function toInternal(ts, o, h, l, c, v, confirm) {
  return {
    timestamp: ts,
    open: o,
    high: h,
    low: l,
    close: c,
    volume: v,
    confirm
  };
}

//export async function fetchCryptoOKX(symbol, timeframe = "15m", limit = 200) {
export async function fetchCryptoOKX(symbol, timeframe = "15m", limit = 4) {

  try {
    const url = `${API_OKX}?instId=${symbol}&bar=${timeframe}&limit=${limit}`;
    const res = await axios.get(url);
    const data = res.data.data || [];

    return data.map(k => {
      const ts = normalizeTimestamp(parseInt(k[0]));
      if (!ts) return null;

      return toInternal(
        ts,
        parseFloat(k[1]),
        parseFloat(k[2]),
        parseFloat(k[3]),
        parseFloat(k[4]),
        parseFloat(k[5]),
        parseInt(k[8])
      );
    }).filter(Boolean);

  } catch (err) {
    console.log("❌ Error OKX:", symbol, timeframe, err.message);
    return [];
  }
}
