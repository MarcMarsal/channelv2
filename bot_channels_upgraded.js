import cron from "node-cron";
import { client, initDB } from "./db/client.js";

import { formatSpainDate, formatSpainTime } from "./core/utils.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";
import { calcularAccioFI } from "./core/fiat.js";
import { generarSenyalLonesome } from "./core/generarSenyalLonesome.js";

import { calculateMACD, calculateATR } from "./core/indicators.js";

const ACTIVE_CRYPTOS = [
  "APT-USDT","ARB-USDT","ATOM-USDT","AVAX-USDT","BNB-USDT",
  "BTC-USDT","ETH-USDT","FET-USDT","INJ-USDT","LINK-USDT",
  "NEAR-USDT","ONDO-USDT","OP-USDT","RENDER-USDT","SEI-USDT",
  "SOL-USDT","SUI-USDT","XRP-USDT"
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

  // INDICADORS
  const macd = calculateMACD(candles);
  const atr  = calculateATR(candles);

  // CANAL OBERT
  const canalOpen = calculateChannelFIAT(candles);

  const existingOpen = await client.query(`
    SELECT id, confirm
    FROM channels_fiat
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
        accio, confirm,
        macd, macd_signal, macd_hist, atr
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7,
        EXTRACT(EPOCH FROM NOW()) * 1000,
        $8, $9,
        $10, $11,
        $12, $13,
        $14, $15,
        '', false,
        $16, $17, $18, $19
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
      formatSpainTime(tsOpen),
      macd.macd,
      macd.signal,
      macd.hist,
      atr
    ]);
  } else {
    const row = existingOpen.rows[0];
    if (row.confirm === false) {
      await client.query(`
        UPDATE channels_fiat
        SET close = $1
        WHERE id = $2
      `, [openCandle.close, row.id]);
    }
  }

  // CANAL TANCAT
  const existingClosed = await client.query(`
    SELECT *
    FROM channels_fiat
    WHERE symbol = $1 AND timestamp = $2
    LIMIT 1
  `, [symbol, tsClosed]);

  if (existingClosed.rows.length === 0) return;

  const canalReal = existingClosed.rows[0];

  if (canalReal.confirm === true) return;

  // 🔥 FIAT PUR: necessitem 4 veles per detectar breakout N i reingrés N+2
  const canalsRecents = await client.query(`
    SELECT id, upper, lower, accio, slope, dev, operable, reason
    FROM channels_fiat
    WHERE symbol = $1
    ORDER BY timestamp DESC
    LIMIT 4
  `, [symbol]);

  const lastChannels = canalsRecents.rows;

  closedCandle.prev_close = prevCandle.close;

  const accioFinal = calcularAccioFI(lastChannels, closedCandle, macd, atr);

  await client.query(`
    UPDATE channels_fiat
    SET close   = $1,
        accio   = $2,
        confirm = true,
        macd = $4,
        macd_signal = $5,
        macd_hist = $6,
        atr = $7
    WHERE id = $3
  `, [
    closedCandle.close,
    accioFinal,
    canalReal.id,
    macd.macd,
    macd.signal,
    macd.hist,
    atr
  ]);

  // 🔥 FIAT PUR: qualsevol acció genera senyal
  if (accioFinal) {

    // 🔥 FIAT PUR: breakout pot ser N o N+1
    let prevAccioFIAT = "";

    if (lastChannels[2]?.accio?.includes("breakout")) {
      prevAccioFIAT = lastChannels[2].accio;   // breakout a N+1 → reingrés immediat
    } else if (lastChannels[3]?.accio?.includes("breakout")) {
      prevAccioFIAT = lastChannels[3].accio;   // breakout a N → reingrés a N+2
    }

    await generarSenyalLonesome(
      symbol,
      tsClosed,
      prevCandle,
      closedCandle,
      {
        ...canalReal,
        accio: accioFinal,
        prev_accio: prevAccioFIAT,
        close: closedCandle.close,
        macd,
        atr
      }
    );
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
  console.log("Bot LonesomeTheBlue PUR 15m en marxa (FIAT + MACD + ATR)");
  cron.schedule("* * * * *", mainLoop);
}

startBot();
