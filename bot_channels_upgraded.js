// bot_channels_15m.js — FIAT LonesomeTheBlue (canals + punxada + reingrés + entrada)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";
import { saveSignalChannels } from "./db/saveSignalChannels.js";
import { saveChannel } from "./db/saveChannel.js";

import { getChannelFIAT } from "./core/channelEngine.js";
import { detectChannelEntry } from "./core/channelSignals.js";
import { classifyChannel } from "./core/channelClassifier.js";

// -------------------------------------------------------------
// UNIVERS FIAT — Optimitzat per mean‑reversion en 15m
// -------------------------------------------------------------
const UNIVERSE = [
  "BTC-USDT","ETH-USDT","BNB-USDT","SOL-USDT","AVAX-USDT","SEI-USDT",
  "APT-USDT","ATOM-USDT","NEAR-USDT","OP-USDT","ARB-USDT","LINK-USDT",
  "RENDER-USDT","FET-USDT","INJ-USDT","SUI-USDT","DOT-USDT","XRP-USDT"
];

// Criptos dolentes eliminades: ADA, LTC, TRX, BCH, VIRTUAL, ASTER, TRUMP, PEPE
// (ATR massa baix, mètxes llargues, rang pobre)

const ACTIVE_CRYPTOS = UNIVERSE;
const TIMEFRAMES = ["15m"];

// -------------------------------------------------------------
// LLEGIR VELAS DE LA DB
// -------------------------------------------------------------
async function getCandlesFromDB(symbol, timeframe, limit = 200) {
  const res = await client.query(
    `
    SELECT *
    FROM candles
    WHERE symbol = $1 AND timeframe = $2
    ORDER BY timestamp DESC
    LIMIT $3
    `,
    [symbol, timeframe, limit]
  );

  return res.rows.reverse();
}

// -------------------------------------------------------------
// PROCESSAR UN SÍMBOL (FIAT LonesomeTheBlue)
// -------------------------------------------------------------
export async function processSymbol(symbol, timeframe) {
  const candles = await getCandlesFromDB(symbol, timeframe, 200);
  if (!candles || candles.length < 80) return;   // 15m: mínim 80 veles

  candles.sort((a, b) => a.timestamp - b.timestamp);
  const lastCandle = candles[candles.length - 1];

  // 1) Calcular canal FIAT (regressió + desviació)
  const channel = getChannelFIAT(candles);
  if (!channel) return;

  // 2) Classificar canal (slope, rang, upper/lower)
  const classification = classifyChannel(channel);

  // 3) Guardar canal FIAT complet
  await saveChannel({
    symbol,
    timeframe,
    slope: channel.slope,
    intercept: channel.intercept,
    endy: channel.endy,
    dev: channel.dev,
    devlen: channel.devlen,
    mid: channel.mid,
    len: channel.len,
    upper: classification.upper,
    lower: classification.lower,
    k: classification.k,
    operable: classification.operable,
    reason: classification.reason,
    timestamp: lastCandle.timestamp
  });

  // 4) Detectar punxada + reingrés + entrada FIAT
  const entry = detectChannelEntry(candles, channel);
  if (!entry) return;

  // 5) Evitar duplicats
  const exists = await alreadySent2(symbol, timeframe, entry.timestamp);
  if (exists) return;

  // 6) Guardar senyal FIAT (sense Telegram)
  await saveSignalChannels({
    symbol,
    timeframe,
    type: entry.type,          // LONG / SHORT
    entry: entry.entry,        // punt FIAT d’entrada
    tp: entry.tp,              // midline
    sl: entry.sl,              // extrem + mètxa
    rr: entry.rr,              // RR FIAT
    timestamp: entry.timestamp,
    color: entry.color,        // groc = punxada, verd = entrada

    slope: channel.slope,
    intercept: channel.intercept,
    endy: channel.endy,
    dev: channel.dev,
    devlen: channel.devlen,
    mid: channel.mid,
    len: channel.len,

    reason: classification.operable ? null : classification.reason,
    operable: classification.operable
  });
}

// -------------------------------------------------------------
// LOOP PRINCIPAL FIAT
// -------------------------------------------------------------
async function mainLoop() {
  for (const symbol of ACTIVE_CRYPTOS) {
    try {
      await processSymbol(symbol, "15m");
    } catch (err) {
      console.log("Error processant", symbol, err.message);
    }
  }
}

// -------------------------------------------------------------
// START BOT
// -------------------------------------------------------------
async function startBot() {
  await initDB();
  console.log("Bot FIAT LonesomeTheBlue 15m en marxa (canals + punxada + reingrés + entrada)");
  cron.schedule("* * * * *", mainLoop);  // cada minut
}

startBot();
