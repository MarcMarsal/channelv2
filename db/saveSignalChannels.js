// db/saveSignalChannels.js — FIAT 15m (punxada + entrada + TP/SL/RR)

import { client } from "./client.js";
import { splitSpainDate } from "../core/utils.js";

export async function saveSignalChannels({
  symbol,
  timeframe,
  type,        // LONG / SHORT
  stage,       // "punxada" / "entrada"
  entry,       // null si és punxada
  tp,
  sl,
  rr,
  timestamp,
  color,       // yellow / green

  slope,
  intercept,
  endy,
  dev,
  devlen,
  mid,
  len,

  operable,
  reason
}) {
  const tsMs = Number(timestamp);
  const createdAt = Date.now();

  const { date_es, hora_es, timestamp_es } = splitSpainDate(tsMs);

  await client.query(
    `
    INSERT INTO signals_channels (
      symbol, timeframe, type, stage, color,
      entry, tp, sl, rr,
      timestamp, timestamp_ms,
      date_es, hora_es, timestamp_es,
      created_at, closed,
      slope, intercept, endy, dev, devlen, mid, len,
      operable, reason
    )
    VALUES (
      $1,$2,$3,$4,$5,
      $6,$7,$8,$9,
      $10,$11,
      $12,$13,$14,
      $15,false,
      $16,$17,$18,$19,$20,$21,$22,
      $23,$24
    )
    ON CONFLICT DO NOTHING
    `,
    [
      symbol, timeframe, type, stage, color,
      entry, tp, sl, rr,
      tsMs, tsMs,
      date_es, hora_es, timestamp_es,
      createdAt,
      slope, intercept, endy, dev, devlen, mid, len,
      operable, reason
    ]
  );
}
