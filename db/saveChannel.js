// db/saveChannel.js — FIAT‑PRO CHANNELS

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

  await client.query(
    `
    INSERT INTO channels_fiat (
      symbol, timeframe,
      slope, intercept, endy, dev, devlen, mid, len,
      timestamp, created_at
    )
    VALUES (
      $1,$2,
      $3,$4,$5,$6,$7,$8,$9,
      $10,$11
    )
    ON CONFLICT DO NOTHING
    `,
    [
      symbol, timeframe,
      slope, intercept, endy, dev, devlen, mid, len,
      timestamp, createdAt
    ]
  );
}
