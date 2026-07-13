// bot_channels_upgraded.js — FIAT‑PRO (canals + regressió + desviació + senyals)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";
import { saveSignalChannels } from "./db/saveSignalChannels.js";
import { saveChannel } from "./db/saveChannel.js";
import { getChannelFIAT } from "./core/channelEngine.js";
import { detectChannelEntry } from "./core/channelSignals.js";
import { classifyChannel } from "./core/channelClassifier.js";

// -------------------------------------------------------------
// UNIVERS FIAT‑PRO (igual que bot de patrons)
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
// LLEGIR VELAS DE LA DB
// -------------------------------------------------------------
async function getCandlesFromDB(symbol, timeframe, limit) {
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
// PROCESSAR UN SÍMBOL (FIAT‑PRO CANALS)
// -------------------------------------------------------------
export async function processSymbol(symbol, timeframe) {
  const candles = await getCandlesFromDB(symbol, timeframe, 200);
  if (!candles || candles.length < 120) return;

  candles.sort((a, b) => a.timestamp - b.timestamp);
  const lastCandle = candles[candles.length - 1];

  // 1) Calcular canal FIAT (LonesomeTheBlue)
  const channel = getChannelFIAT(candles);
  if (!channel) return;

  // 2) Classificar canal FIAT‑PRO (upper/lower/k + operabilitat)
  const classification = classifyChannel(channel);

  // 3) Guardar canal FIAT‑PRO complet
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

  // 4) Si el canal NO és operable → NO hi ha senyal
  // 4) FIAT‑PRO: si el canal NO és operable → igualment generem alerta,
  // però amb la raó de cancel·lació (per validació i panell)
  const entry = detectChannelEntry(candles);
  if (!entry) return;

  // 5) Evitar duplicats de senyal
  const exists = await alreadySent2(symbol, timeframe, entry.timestamp);
  if (exists) return;

  // 6) Guardar senyal FIAT‑PRO + Telegram
  await saveSignalChannels({
    symbol,
    timeframe,
    type: entry.type,          // LONG / SHORT
    entry: entry.entry,
    tp: entry.tp,
    sl: entry.sl,
    timestamp: entry.timestamp,
    color: entry.color,

    slope: channel.slope,
    intercept: channel.intercept,
    endy: channel.endy,
    dev: channel.dev,
    devlen: channel.devlen,
    mid: channel.mid,
    len: channel.len,

    // NOVETAT: si no operable → guardar raó
    reason: classification.operable ? null : classification.reason,
    operable: classification.operable
  });

}

// -------------------------------------------------------------
// LOOP PRINCIPAL FIAT‑PRO
// -------------------------------------------------------------
async function mainLoop() {
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
  console.log("Bot FIAT‑PRO Channels en marxa (canals + regressió + desviació + senyals)");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
