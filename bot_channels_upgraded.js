// bot_channels_upgraded.js — LonesomeTheBlue PUR (canals FIAT + breakout + reingrés + criteris Lonesome)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";

import { formatSpainDate, formatSpainTime } from "./core/utils.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";
import { calcularAccioFI } from "./core/logic/fiat.js";
import { generarSenyalLonesome } from "./core/generarSenyalLonesome.js";

const ACTIVE_CRYPTOS = [
  "APT-USDT","ARB-USDT","ATOM-USDT","AVAX-USDT","BNB-USDT",
  "BTC-USDT","ETH-USDT","FET-USDT","INJ-USDT","LINK-USDT",
  "NEAR-USDT","ONDO-USDT","OP-USDT","RENDER-USDT","SEI-USDT",
  "SOL-USDT","SUI-USDT"
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
  // 1) CANAL OBERT (tsOpen) — es pot actualitzar mentre confirm=false
  // -------------------------------------------------------------
  const canalOpen = calculateChannelFIAT(candles);

  const existingOpen = await client.query(`
    SELECT id, confirm
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, tsOpen]);

  if (existingOpen.rows.length === 0) {
    // crear canal obert
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
  } else {
    // opcional: actualitzar només close del canal obert si encara no està confirmat
    const row = existingOpen.rows[0];
    if (row.confirm === false) {
      await client.query(`
        UPDATE channels_fiat
        SET close = $1
        WHERE id = $2
      `, [openCandle.close, row.id]);
    }
  }

  // -------------------------------------------------------------
  // 2) CANAL TANCAT (tsClosed) — només es processa si confirm=false
  // -------------------------------------------------------------
  const existingClosed = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
    LIMIT 1
  `, [symbol, tsClosed]);

  if (existingClosed.rows.length === 0) {
    // si no existeix canal per la vela tancada, no podem fer res
    return;
  }

  const canalReal = existingClosed.rows[0];

  // PATCH FIAT: si el canal ja està confirmat, NO es toca mai més
  if (canalReal.confirm === true) {
    return;
  }

  // canals recents per reingrés (ordre DESC)
  const canalsRecents = await client.query(`
    SELECT id, upper, lower, accio, slope, dev, operable, reason
    FROM channels_fiat
    WHERE symbol = $1
    ORDER BY timestamp DESC
    LIMIT 3
  `, [symbol]);

  const lastChannels = canalsRecents.rows;

  // calcular acció FI (breakout + reingrés) sobre la vela tancada
  closedCandle.prev_close = prevCandle.close;

  const accioFinal = calcularAccioFI(lastChannels, closedCandle);

  // congelar canal FIAT tancat: afegir close, acció i confirm=true
  await client.query(`
    UPDATE channels_fiat
    SET close   = $1,
        accio   = $2,
        confirm = true
    WHERE id = $3
  `, [
    closedCandle.close,
    accioFinal,
    canalReal.id
  ]);

  // ALERTES NOMÉS SI HI HA ACCIÓ REAL (breakout o reingrés)
  if (accioFinal && (accioFinal.includes("breakout") || accioFinal.includes("reingres"))) {
    await generarSenyalLonesome(
      symbol,
      tsClosed,
      prevCandle,
      closedCandle,
      { ...canalReal, accio: accioFinal, close: closedCandle.close }
    );
  }

  // FI: aquest canal ja queda congelat (confirm=true) i mai més es toca
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
  console.log("Bot LonesomeTheBlue PUR 15m en marxa (FIAT amb canals congelats)");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
