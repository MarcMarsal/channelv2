// bot_channels_upgraded.js — LonesomeTheBlue PUR (canals FIAT + breakout + reingrés + criteris Lonesome)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";

import { formatSpainDate, formatSpainTime } from "./core/utils.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";
import { calcularAccioFIAT } from "./core/calcularAccioFIAT.js";
import { generarSenyalLonesome } from "./core/generarSenyalLonesome.js";

const ACTIVE_CRYPTOS = [
  "APT-USDT","ARB-USDT","ATOM-USDT","AVAX-USDT","BNB-USDT",
  "BTC-USDT","ETH-USDT","FET-USDT","INJ-USDT","LINK-USDT",
  "NEAR-USDT","ONDO-USDT","OP-USDT","RENDER-USDT","SEI-USDT",
  "SOL-USDT","SUI-USDT","WXT-USDT"
];

async function getCandlesFromDB(symbol, timeframe, limit = 200) {
  const res = await client.query(`
    SELECT *
    FROM candles
    WHERE symbol = $1 AND timeframe = $2
    ORDER BY timestamp DESC
    LIMIT $3
  `, [symbol, timeframe, limit]);

  return res.rows.reverse();
}

export async function processSymbolFIAT(symbol, candles) {
  if (!candles || candles.length < 3) return;

  const prevCandle   = candles[candles.length - 3];
  const closedCandle = candles[candles.length - 2];
  const openCandle   = candles[candles.length - 1];

  const tsClosed = closedCandle.timestamp;
  const tsOpen   = openCandle.timestamp;

  // -------------------------------------------------------------
  // CANAL FIAT (Lonesome el necessita)
  // -------------------------------------------------------------
  const canalOpen = calculateChannelFIAT(candles);

  // -------------------------------------------------------------
  // 1) INSERT canal obert (igual que FIAT)
  // -------------------------------------------------------------
  const existingOpen = await client.query(`
    SELECT id FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, tsOpen]);

  if (existingOpen.rows.length === 0) {
    await client.query(`
      INSERT INTO channels_fiat (
        symbol, slope, intercept, dev, devlen, mid,
        timestamp, created_at,
        upper, lower,
        operable, reason,
        open, close,
        data_es, hora_es,
        accio, confirm
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7,
        EXTRACT(EPOCH FROM NOW()) * 1000,
        $8, $9,
        $10, $11,
        $12, $13,
        $14, $15,
        '', false
      )
    `, [
      symbol,
      canalOpen.slope,
      canalOpen.intercept,
      canalOpen.dev,
      canalOpen.devlen,
      canalOpen.mid,
      tsOpen,
      canalOpen.upper,
      canalOpen.lower,
      canalOpen.operable,
      canalOpen.reason,
      openCandle.open,
      openCandle.close,
      formatSpainDate(tsOpen),
      formatSpainTime(tsOpen)
    ]);
  }

  // -------------------------------------------------------------
  // 2) CANAL TANCAT (FIAT) → aquí substituïm FIAT per Lonesome
  // -------------------------------------------------------------
  const existingClosed = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, tsClosed]);

  if (existingClosed.rows.length > 0 && closedCandle.confirm === true) {

    const canalDB = await client.query(`
      SELECT *
      FROM channels_fiat
      WHERE symbol = $1 AND timestamp = $2
      LIMIT 1
    `, [symbol, tsClosed]);

    const canalReal = canalDB.rows[0];
    if (!canalReal) return;

    // Acció FIAT (Lonesome la necessita)
    const accio = calcularAccioFIAT(
      closedCandle.open,
      closedCandle.close,
      canalReal.upper,
      canalReal.lower
    );

    // Actualitzar canal (igual que FIAT)
    await client.query(`
      UPDATE channels_fiat
      SET close   = $1,
          accio   = $2,
          confirm = true
      WHERE id = $3
    `, [
      closedCandle.close,
      accio,
      existingClosed.rows[0].id
    ]);

    // ---------------------------------------------------------
    // SUBSTITUCIÓ FIAT → LONESOME PUR
    // ---------------------------------------------------------

// ---------------------------------------------------------
// DETECCIÓ FI DE REINGRÉS IMMEDIAT (sense variables globals)
// ---------------------------------------------------------

// Carregar els 3 últims canals del símbol
const canalsRecents = await client.query(`
  SELECT accio
  FROM channels_fiat
  WHERE symbol = $1
  ORDER BY timestamp DESC
  LIMIT 3
`, [symbol]);

if (canalsRecents.rows.length < 3) return;

const accioN   = canalsRecents.rows[0].accio || "";
const accioN1  = canalsRecents.rows[1].accio || "";
const accioN2  = canalsRecents.rows[2].accio || "";

// Reingrés immediat institucional
const reingresImmediat =
  accioN.includes("reingres") &&
  (accioN1.includes("breakout") || accioN2.includes("breakout"));

// Reingrés tardà → descartat
if (accioN.includes("reingres") && !reingresImmediat) {
  // Opcional: pots fer un INSERT DISCARDED aquí
  return;
}

// Només reingrés immediat → Lonesome PUR
if (reingresImmediat) {
  const exists = await alreadySent2(symbol, "15m", tsClosed);
  if (!exists) {
    await generarSenyalLonesome(
      symbol,
      tsClosed,
      prevCandle,
      closedCandle,
      canalReal
    );
  }
}


  }
}

async function mainLoop() {
  for (const symbol of ACTIVE_CRYPTOS) {
    try {
      const candles = await getCandlesFromDB(symbol, "15m", 200);
      await processSymbolFIAT(symbol, candles);
    } catch (err) {
      console.log("Error processant", symbol, err.message);
    }
  }
}

async function startBot() {
  await initDB();
  console.log("Bot LonesomeTheBlue PUR 15m en marxa");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
