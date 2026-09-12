// scheduler.js

import cron from "node-cron";
import { fetchAndStoreCandles } from "./fetchAndStore.js";

const LONESOME_SYMBOLS = [
  "BTC-USDT",
  "ETH-USDT",
  "INJ-USDT",
  "LINK-USDT",
  "NEAR-USDT"
];

export function startCandleScheduler() {
  cron.schedule("* * * * *", async () => {
    for (const s of LONESOME_SYMBOLS) {
      await fetchAndStoreCandles(s, "15m");
    }
  });

  console.log("Candle scheduler FI (OKX only, Lonesome only) en marxa");
}

startCandleScheduler();

