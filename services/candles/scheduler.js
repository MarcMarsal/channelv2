// scheduler.js

import cron from "node-cron";
import { fetchAndStoreCandles } from "./fetchAndStore.js";

const UNIVERSE = [
  "AAVE-USDT","ADA-USDT","APT-USDT","ARB-USDT","ASTER-USDT","ATOM-USDT",
  "AVAX-USDT","BCH-USDT","BNB-USDT","BTC-USDT","DOGE-USDT",
  "DOT-USDT","ENA-USDT","ETH-USDT","FET-USDT","GRAM-USDT",
  "HBAR-USDT","INJ-USDT","KAITO-USDT","LINK-USDT","LTC-USDT",
  "NEAR-USDT","ONDO-USDT","OP-USDT","PENGU-USDT",
  "PEPE-USDT","RENDER-USDT","RON-USDT","SEI-USDT","SOL-USDT",
  "SUI-USDT","TRUMP-USDT","VIRTUAL-USDT","XRP-USDT"
];

async function candleLoop() {
  for (const s of UNIVERSE) {
    await fetchAndStoreCandles(s, "15m");
  }
}

export function startCandleScheduler() {
  cron.schedule("* * * * *", candleLoop);
  console.log("Candle scheduler FI seqüencial en marxa");
}

startCandleScheduler();

