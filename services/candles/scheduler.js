// scheduler.js — FI, independent, només baixa 4 veles 15m

import cron from "node-cron";
import { initDB } from "../../db/client.js";
import { fetchAndStoreCandles } from "./fetchAndStore.js";
import { UNIVERSE } from "./activeCryptos.js";

const TIMEFRAMES_DOWNLOAD = ["15m"];
let isRunning = false;

async function downloaderLoop() {
  if (isRunning) return;
  isRunning = true;

  try {
    for (const symbol of UNIVERSE) {
      for (const timeframe of TIMEFRAMES_DOWNLOAD) {
        await fetchAndStoreCandles(symbol, timeframe);   // 🔥 EXACTAMENT com micropulse
      }
    }
  } catch (err) {
    console.log("❌ Error downloader FI:", err.message);
  }

  isRunning = false;
}

export async function startCandleScheduler() {
  await initDB();
  console.log("Downloader FI (4 veles 15m) en marxa");
  cron.schedule("* * * * *", downloaderLoop);
}

startCandleScheduler();
