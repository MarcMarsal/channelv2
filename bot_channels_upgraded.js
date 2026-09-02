// bot_channels_upgraded.js — FIAT LonesomeTheBlue (canals + punxada + reingrés + entrada)
// bot_channels_upgraded.js — FIAT LonesomeTheBlue (versió corregida)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";

import { formatSpainDate, formatSpainTime } from "./core/utils.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";
import { calcularAccioFIAT } from "./core/calcularAccioFIAT.js";
import { generarSenyalFIAT } from "./core/generarSenyalFIAT.js";

const ACTIVE_CRYPTOS = [
  "BTC-USDT","ETH-USDT","BNB-USDT","SOL-USDT","AVAX-USDT","SEI-USDT",
  "APT-USDT","ATOM-USDT","NEAR-USDT","OP-USDT","ARB-USDT","LINK-USDT",
  "RENDER-USDT","FET-USDT","INJ-USDT","SUI-USDT","ONDO-USDT"
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
  if (!candles || candles.length < 2) return;

  const closedCandle = candles[candles.length - 2]; // VELA TANCADA
  const openCandle   = candles[candles.length - 1]; // VELA OBERTA

  const tsClosed = closedCandle.timestamp;
  const tsOpen   = openCandle.timestamp;

  const existingClosed = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, tsClosed]);

  const canal = calculateChannelFIAT(candles);

  // -------------------------------------------------------------
  // 1) CANAL NOU SOBRE LA VELA OBERTA (si no existeix)
  // -------------------------------------------------------------
  const existingOpen = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, tsOpen]);

  if (existingOpen.rows.length === 0) {
    await client.query(`
      INSERT INTO channels_fiat (
        symbol, timestamp, data_es, hora_es,
        open, close,
        slope, intercept, dev, devlen, mid, upper, lower,
        operable, reason,
        accio,
        confirm,
        created_at
      ) VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15,
        '',
        false,
        EXTRACT(EPOCH FROM NOW()) * 1000
      )
    `, [
      symbol, tsOpen,
      formatSpainDate(tsOpen), formatSpainTime(tsOpen),
      openCandle.open, openCandle.close,
      canal.slope, canal.intercept, canal.dev, canal.devlen,
      canal.mid, canal.upper, canal.lower,
      canal.operable, canal.reason
    ]);
  }

  // -------------------------------------------------------------
  // 2) CANAL TANCAT SOBRE LA VELA TANCADA
  // -------------------------------------------------------------
  if (existingClosed.rows.length > 0 && closedCandle.confirm === true) {

    const accio = calcularAccioFIAT(
      closedCandle.open,
      closedCandle.close,
      canal.upper,
      canal.lower
    );

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

    if (accio !== "") {
      const exists = await alreadySent2(symbol, "15m", tsClosed);
      if (!exists) {
        await generarSenyalFIAT(
          symbol, tsClosed, accio,
          closedCandle.open, closedCandle.close,
          canal.upper, canal.lower
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
  console.log("Bot FIAT LonesomeTheBlue 15m en marxa");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
