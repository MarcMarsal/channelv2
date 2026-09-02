// bot_channels_upgraded.js — FIAT LonesomeTheBlue (canals + punxada + reingrés + entrada)


import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";

import { formatSpainDate, formatSpainTime } from "./core/utils.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";
import { calcularAccioFIAT } from "./core/calcularAccioFIAT.js";
import { generarSenyalFIAT } from "./core/generarSenyalFIAT.js";

// -------------------------------------------------------------
// UNIVERS FIAT — Optimitzat per mean‑reversion en 15m
// -------------------------------------------------------------
const UNIVERSE = [
  "BTC-USDT","ETH-USDT","BNB-USDT","SOL-USDT","AVAX-USDT","SEI-USDT",
  "APT-USDT","ATOM-USDT","NEAR-USDT","OP-USDT","ARB-USDT","LINK-USDT",
  "RENDER-USDT","FET-USDT","INJ-USDT","SUI-USDT","ONDO-USDT"
];

const ACTIVE_CRYPTOS = UNIVERSE;

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
export async function processSymbolFIAT(symbol, candles) {
  if (!candles || candles.length === 0) return;

  // 1) Vela oberta (última)
  const lastCandle = candles[candles.length - 1];

  // 2) Canal més recent per aquest symbol
  const lastChannelRes = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1
    ORDER BY timestamp DESC
    LIMIT 1
  `, [symbol]);

  const lastChannel = lastChannelRes.rows[0] || null;
  const tsChannel   = lastChannel ? lastChannel.timestamp : null;

  // 3) Decidir quin timestamp processar
  let tsToProcess;

  if (!tsChannel) {
    // No hi ha cap canal → primer canal sobre la vela oberta
    tsToProcess = lastCandle.timestamp;
  } else if (lastCandle.timestamp > tsChannel) {
    // Hi ha una vela nova → canal nou sobre la vela nova
    tsToProcess = lastCandle.timestamp;
  } else {
    // Encara estem treballant sobre la vela del canal actual
    tsToProcess = tsChannel;
  }

  // 4) Buscar la vela que coincideix amb tsToProcess
  const candle = candles.find(c => c.timestamp === tsToProcess);
  if (!candle) return;

  const ts      = candle.timestamp;
  const open    = candle.open;
  const close   = candle.close;
  const confirm = candle.confirm;

  const data_es = formatSpainDate(ts);
  const hora_es = formatSpainTime(ts);

  // 5) Buscar si ja existeix un canal per aquesta vela
  const existing = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
  `, [symbol, ts]);

  // 6) Calcular canal (amb totes les veles tancades disponibles)
  const canal = calculateChannelFIAT(candles);

  // -------------------------------------------------------------
  // 7) NO existeix + confirm=false → INSERT preliminar (canal nou)
  // -------------------------------------------------------------
  if (existing.rows.length === 0 && confirm === false) {

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
      symbol, ts, data_es, hora_es,
      open, close,
      canal.slope, canal.intercept, canal.dev, canal.devlen, canal.mid, canal.upper, canal.lower,
      canal.operable, canal.reason
    ]);

    return;
  }

  // -------------------------------------------------------------
  // 8) Existeix + confirm=false → UPDATE només del close (canal obert)
  // -------------------------------------------------------------
  if (existing.rows.length > 0 && confirm === false) {

    await client.query(`
      UPDATE channels_fiat
      SET close = $1
      WHERE id = $2
    `, [
      close,
      existing.rows[0].id
    ]);

    return;
  }

  // -------------------------------------------------------------
  // 9) Existeix + confirm=true → UPDATE final + acció + senyal (canal tancat)
  // -------------------------------------------------------------
  if (existing.rows.length > 0 && confirm === true) {

    const accio = calcularAccioFIAT(open, close, canal.upper, canal.lower);

    await client.query(`
      UPDATE channels_fiat
      SET close   = $1,
          accio   = $2,
          confirm = true
      WHERE id = $3
    `, [
      close,
      accio,
      existing.rows[0].id
    ]);

    if (accio !== "") {
      const exists = await alreadySent2(symbol, "15m", ts);
      if (!exists) {
        await generarSenyalFIAT(symbol, ts, accio, open, close, canal.upper, canal.lower);
      }
    }

    return;
  }
}

// -------------------------------------------------------------
// LOOP PRINCIPAL FIAT
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// START BOT
// -------------------------------------------------------------
async function startBot() {
  await initDB();
  console.log("Bot FIAT LonesomeTheBlue 15m en marxa (canals + punxada + reingrés + entrada)");
  cron.schedule("* * * * *", mainLoop);  // cada minut
}

startBot();
