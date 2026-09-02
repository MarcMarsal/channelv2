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
  "RENDER-USDT","FET-USDT","INJ-USDT","SUI-USDT","ONDO-USDT"
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
  if (!candles || candles.length < 80) return;

  candles.sort((a, b) => a.timestamp - b.timestamp);
  const lastCandle = candles[candles.length - 1];

  // 1) Canal FIAT
  const channel = getChannelFIAT(candles);
  if (!channel) return;

  // 2) Classificació
  const classification = classifyChannel(channel);

  // 3) Guardar canal
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

  // 4) STAGE
  let stageRes = await client.query(
    `SELECT stage FROM channel_stage WHERE symbol = $1 AND timeframe = $2`,
    [symbol, timeframe]
  );

  let stage = stageRes.rows.length ? stageRes.rows[0].stage : 0;
  if (stage === null) stage = 0;

  const sig = detectChannelEntry(candles, channel, stage);

  // --- STAGE 0: BREAKOUT ---
  if (stage === 0 && sig.breakout) {
    await client.query(
      `INSERT INTO channel_stage(symbol, timeframe, stage)
       VALUES ($1,$2,$3)
       ON CONFLICT (symbol,timeframe) DO UPDATE SET stage = $3`,
      [symbol, timeframe, 1]
    );

    const alert = {
      symbol,
      timeframe,
      type: sig.side === "upper" ? "BREAKOUT_UPPER" : "BREAKOUT_LOWER",
      entry: lastCandle.close,
      timestamp: lastCandle.timestamp,
      color: "yellow",

      slope: channel.slope,
      intercept: channel.intercept,
      endy: channel.endy,
      dev: channel.dev,
      devlen: channel.devlen,
      mid: channel.mid,
      len: channel.len,
      reason: classification.reason,
      operable: classification.operable
    };

    const exists = await alreadySent2(symbol, timeframe, alert.timestamp);
    if (!exists) await saveSignalChannels(alert);

    return;
  }

  // --- STAGE 1: REINGRÉS ---
  if (stage === 1 && sig.reingres) {
    await client.query(
      `UPDATE channel_stage SET stage = 2 WHERE symbol = $1 AND timeframe = $2`,
      [symbol, timeframe]
    );

    const alert = {
      symbol,
      timeframe,
      type: sig.side === "upper" ? "REINGRES_UPPER" : "REINGRES_LOWER",
      entry: lastCandle.close,
      timestamp: lastCandle.timestamp,
      color: "orange",

      slope: channel.slope,
      intercept: channel.intercept,
      endy: channel.endy,
      dev: channel.dev,
      devlen: channel.devlen,
      mid: channel.mid,
      len: channel.len,
      reason: classification.reason,
      operable: classification.operable
    };

    const exists = await alreadySent2(symbol, timeframe, alert.timestamp);
    if (!exists) await saveSignalChannels(alert);

    return;
  }

  // --- STAGE 2: ENTRADA ---
  if (stage === 2 && sig.entrada) {
    const entry = {
      symbol,
      timeframe,
      type: sig.side,
      entry: lastCandle.close,
      tp: channel.mid,

      sl: sig.side === "LONG"
        ? channel.lower - Math.abs(lastCandle.close - channel.lower)
        : channel.upper + Math.abs(lastCandle.close - channel.upper),

      rr: sig.side === "LONG"
        ? (channel.mid - lastCandle.close) / (lastCandle.close - channel.lower)
        : (lastCandle.close - channel.mid) / (channel.upper - lastCandle.close),

      timestamp: lastCandle.timestamp,
      color: "green",

      slope: channel.slope,
      intercept: channel.intercept,
      endy: channel.endy,
      dev: channel.dev,
      devlen: channel.devlen,
      mid: channel.mid,
      len: channel.len,
      reason: classification.reason,
      operable: classification.operable
    };

    const exists = await alreadySent2(symbol, timeframe, entry.timestamp);
    if (!exists) await saveSignalChannels(entry);

    await client.query(
      `UPDATE channel_stage SET stage = 0 WHERE symbol = $1 AND timeframe = $2`,
      [symbol, timeframe]
    );
  }
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
