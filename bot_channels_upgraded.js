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

  const channel = getChannelFIAT(candles);
  if (!channel) return;

  const classification = classifyChannel(channel);

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

 // -------------------------------------------------------------
// 4) FIAT STAGE — punxada → reingrés → entrada
// -------------------------------------------------------------

let stageRes = await client.query(
  `SELECT stage FROM channel_stage WHERE symbol = $1 AND timeframe = $2`,
  [symbol, timeframe]
);

let stage = stageRes.rows.length ? stageRes.rows[0].stage : 0;
if (stage === null) stage = 0;

const sig = detectChannelEntry(candles, channel);

// -------------------------------------------------------------
// STAGE 0 → PUNXADA FIAT
// -------------------------------------------------------------
if (stage === 0 && sig?.punxada) {
  await client.query(
    `INSERT INTO channel_stage(symbol, timeframe, stage)
     VALUES ($1,$2,$3)
     ON CONFLICT (symbol,timeframe) DO UPDATE SET stage = $3`,
    [symbol, timeframe, 1]
  );
  return;
}

// -------------------------------------------------------------
// STAGE 1 → REINGRÉS FIAT
// -------------------------------------------------------------
if (stage === 1 && sig?.reingres) {

  const wasOutside = candles.slice(-3).some(c =>
    c.low < classification.lower || c.high > classification.upper
  );

  if (!wasOutside) {
    await client.query(
      `UPDATE channel_stage SET stage = 0 WHERE symbol = $1 AND timeframe = $2`,
      [symbol, timeframe]
    );
    return;
  }

  await client.query(
    `UPDATE channel_stage SET stage = 2 WHERE symbol = $1 AND timeframe = $2`,
    [symbol, timeframe]
  );
  return;
}

// -------------------------------------------------------------
// STAGE 2 → ENTRADA FIAT INSTITUCIONAL
// -------------------------------------------------------------
if (stage === 2 && sig?.entrada) {

  const entry = {
    symbol,
    timeframe,
    type: sig.side === "lower" ? "LONG" : "SHORT",
    entry: lastCandle.close,
    tp: channel.mid,

    sl: sig.side === "lower"
      ? channel.lower - Math.abs(lastCandle.close - channel.lower)
      : channel.upper + Math.abs(lastCandle.close - channel.upper),

    rr: sig.side === "lower"
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
    reason: classification.operable ? null : classification.reason,
    operable: classification.operable
  };

  const exists = await alreadySent2(symbol, timeframe, entry.timestamp);
  if (!exists) {
    await saveSignalChannels(entry);
  }

  await client.query(
    `UPDATE channel_stage SET stage = 0 WHERE symbol = $1 AND timeframe = $2`,
    [symbol, timeframe]
  );

  return;
}

if (stage === 2 && !sig?.entrada) {
  return;
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
  cron.schedule("* * * * *", mainLoop);
}

startBot();
