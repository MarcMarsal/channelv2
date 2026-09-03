// bot_tracking_fiat.js — FIAT TP/SL tracking

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { formatSpainDate, formatSpainTime } from "./core/utils.js";

async function getOpenSignals() {
  const res = await client.query(`
    SELECT *
    FROM signals_channels
    WHERE closed = false
  `);
  return res.rows;
}

async function getLastOpenCandle(symbol) {
  const res = await client.query(`
    SELECT *
    FROM candles
    WHERE symbol = $1 AND timeframe = '15m'
    ORDER BY timestamp DESC
    LIMIT 1
  `, [symbol]);

  return res.rows[0];
}

async function closeSignal(signal, result, price_exit, timestamp_exit) {
  const duration_ms = timestamp_exit - signal.timestamp_ms;

  await client.query(`
    UPDATE signals_channels
    SET closed = true,
        result = $1,
        price_exit = $2,
        timestamp_exit = $3,
        duration_ms = $4,
        date_exit_es = $5,
        hora_exit_es = $6
    WHERE id = $7
  `, [
    result,
    price_exit,
    timestamp_exit,
    duration_ms,
    formatSpainDate(timestamp_exit),
    formatSpainTime(timestamp_exit),
    signal.id
  ]);

  console.log(`FIAT TRACKING: ${signal.symbol} → ${result.toUpperCase()} @ ${price_exit}`);
}

async function processTracking() {
  const signals = await getOpenSignals();

  for (const s of signals) {
    try {
      const candle = await getLastOpenCandle(s.symbol);
      if (!candle) continue;

      const price = candle.close;
      const now = Date.now();

      // LONG
      if (s.type === "reingres_inferior") {
        if (price >= s.tp) {
          await closeSignal(s, "tp", price, now);
        } else if (price <= s.sl) {
          await closeSignal(s, "sl", price, now);
        }
      }

      // SHORT
      if (s.type === "reingres_superior") {
        if (price <= s.tp) {
          await closeSignal(s, "tp", price, now);
        } else if (price >= s.sl) {
          await closeSignal(s, "sl", price, now);
        }
      }

    } catch (err) {
      console.log("FIAT TRACKING ERROR", s.symbol, err.message);
    }
  }
}

async function startTrackingBot() {
  await initDB();
  console.log("Bot FIAT Tracking TP/SL en marxa");

  // Cada minut
  cron.schedule("* * * * *", processTracking);
}

startTrackingBot();
