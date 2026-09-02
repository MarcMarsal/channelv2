// bot_channels_15m.js — FIAT LonesomeTheBlue (canals + punxada + reingrés + entrada)

import cron from "node-cron";
import { client, initDB } from "./db/client.js";
import { alreadySent2 } from "./db/alreadySent2.js";
//import { saveSignalChannels } from "./db/saveSignalChannels.js";
//import { saveChannel } from "./db/saveChannel.js";

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
export async function processSymbolFIAT(symbol, candles) {
    const last = candles[candles.length - 1];
    if (!last) return;

    const open    = last.open;
    const close   = last.close;
    const ts      = last.timestamp;
    const confirm = last.confirm;

    const data_es = formatSpainDate(ts);
    const hora_es = formatSpainTime(ts);

    const canal = calculateChannelFIAT(candles);

    // -------------------------------------------------------------
    // 1) Buscar si ja existeix un canal per aquesta vela (timestamp)
    // -------------------------------------------------------------
    const existing = await client.query(`
        SELECT * FROM channels_fiat
        WHERE symbol = $1 AND timestamp = $2
    `, [symbol, ts]);

    // -------------------------------------------------------------
    // 2) Si NO existeix i confirm=false → INSERT preliminar
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
    // 3) Si existeix i confirm=false → UPDATE només del close
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
    // 4) Si existeix i confirm=true → UPDATE final + acció + senyal
    // -------------------------------------------------------------
    if (existing.rows.length > 0 && confirm === true) {

        const accio = calcularAccioFIAT(open, close, canal.upper, canal.lower);

        await client.query(`
            UPDATE channels_fiat
            SET close = $1,
                accio = $2,
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
