// bot_channels_upgraded.js — FIAT‑PRO (canals + regressió + desviació + entrades)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";
import { saveSignal2 } from "./db/saveSignal2.js";
import { getChannelFIAT } from "./core/channelEngine.js";   // 🔥 nou
import { detectChannelEntry } from "./core/channelSignals.js"; // 🔥 nou

// -------------------------------------------------------------
// UNIVERS FIAT‑PRO (igual que patrons)
// -------------------------------------------------------------
const UNIVERSE = [
  "APT-USDT","LINK-USDT","OP-USDT","SOL-USDT","BTC-USDT","FET-USDT",
  "RENDER-USDT","XRP-USDT","ARB-USDT","ATOM-USDT","BNB-USDT","DOT-USDT",
  "ETH-USDT","INJ-USDT","PEPE-USDT","TRUMP-USDT","ADA-USDT","ASTER-USDT",
  "AVAX-USDT","BCH-USDT","HBAR-USDT","NEAR-USDT","SEI-USDT","SUI-USDT",
  "VIRTUAL-USDT","LTC-USDT"
];

const ACTIVE_CRYPTOS = UNIVERSE;
const TIMEFRAMES = ["1H"];

// -------------------------------------------------------------
// LLEGIR VELAS DE LA DB (igual que patrons)
// -------------------------------------------------------------
async function getCandlesFromDB(symbol, timeframe, limit) {
  const res = await client.query(`
    SELECT *
    FROM candles
    WHERE symbol = $1 AND timeframe = $2
    ORDER BY timestamp DESC
    LIMIT $3
  `, [symbol, timeframe, limit]);

  return res.rows.reverse();
}

// -------------------------------------------------------------
// PROCESSAR UN SÍMBOL (FIAT‑PRO CANALS)
// -------------------------------------------------------------
export async function processSymbol(symbol, timeframe) {

  const candles = await getCandlesFromDB(symbol, timeframe, 200);
  if (!candles || candles.length < 120) return;

  candles.sort((a, b) => a.timestamp - b.timestamp);

  // --- 1) Calcular canal FIAT (LonesomeTheBlue)
  const channel = getChannelFIAT(candles);  
  if (!channel) return;

  // --- 2) Detectar entrada FIAT (sobreextensió)
  const entry = detectChannelEntry(candles, channel);
  if (!entry) return;

  // --- 3) Evitar duplicats
  const exists = await alreadySent2(symbol, timeframe, entry.timestamp);
  if (exists) return;

  // --- 4) Guardar senyal FIAT‑PRO (igual que patrons)
  await saveSignal2({
    symbol,
    timeframe,
    type: entry.type,       // LONG / SHORT
    entry: entry.entry,
    tp: entry.tp,
    sl: entry.sl,
    timestamp: entry.timestamp,
    color: entry.color,     // verd / vermell / cyan
    isGood: true,           // canals no tenen GOOD/DISCARD
    slope: channel.slope,
    upper: channel.upper,
    lower: channel.lower,
    mid: channel.mid,
    dev: channel.dev
  });
}

// -------------------------------------------------------------
// LOOP PRINCIPAL FIAT‑PRO (igual que patrons)
// -------------------------------------------------------------
async function mainLoop() {

  // 🔥 NO baixem veles — ja les baixa el bot de patrons
  // 🔥 Només llegim veles i calculem canals

  for (const symbol of ACTIVE_CRYPTOS) {
    for (const timeframe of TIMEFRAMES) {
      try {
        await processSymbol(symbol, timeframe);
      } catch (err) {
        console.log("Error processant", symbol, timeframe, err.message);
      }
    }
  }
}

// -------------------------------------------------------------
// START BOT
// -------------------------------------------------------------
async function startBot() {
  await initDB();
  console.log("Bot FIAT‑PRO Channels en marxa (canals + regressió + desviació)");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
