// db/saveChannel.js — FIAT‑PRO CHANNELS (amb K integrada)

import { client } from "./client.js";

export async function saveChannel({
  symbol,
  timeframe,
  slope,
  intercept,
  endy,
  dev,
  devlen,
  mid,
  len,
  timestamp
}) {
  const createdAt = Date.now();

  // 🔥 Factor corrector per apropar-se a TradingView
  const k = 0.8;

  // Canal matemàtic pur
  const upper_raw = endy + dev * devlen;
  const lower_raw = endy - dev * devlen;

  // Canal corregit amb K (el bot operarà amb aquest)
  const upper = endy + (upper_raw - endy) * k;
  const lower = endy + (lower_raw - endy) * k;

  await client.query(
    `
    INSERT INTO channels_fiat (
      symbol, timeframe,
      slope, intercept, endy, dev, devlen, mid, len,
      upper, lower, k,
      timestamp, created_at
    )
    VALUES (
      $1,$2,
      $3,$4,$5,$6,$7,$8,$9,
      $10,$11,$12,
      $13,$14
    )
    ON CONFLICT DO NOTHING
    `,
    [
      symbol, timeframe,
      slope, intercept, endy, dev, devlen, mid, len,
      upper, lower, k,
      timestamp, createdAt
    ]
  );
}
