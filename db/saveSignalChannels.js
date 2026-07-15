// db/saveSignalChannels.js — FIAT‑PRO CHANNEL SIGNALS

import { client } from "./client.js";
import { splitSpainDate } from "../core/utils.js";
import { sendTelegram } from "../telegram/send.js";

export async function saveSignalChannels({
  symbol,
  timeframe,
  type,
  entry,
  tp,
  sl,
  timestamp,
  color,

  slope,
  intercept,
  endy,
  dev,
  devlen,
  mid,
  len,

  // 🔥 NOVETAT FIAT‑PRO
  operable,
  reason
}) {
  const tsMs = Number(timestamp);
  const createdAt = Date.now();

  const { date_es, hora_es, timestamp_es } = splitSpainDate(tsMs);

  await client.query(
    `
    INSERT INTO signals_channels (
      symbol, timeframe, type, color,
      entry, tp, sl,
      timestamp, timestamp_ms,
      date_es, hora_es, timestamp_es,
      created_at, closed,
      slope, intercept, endy, dev, devlen, mid, len,
      operable, reason
    )
    VALUES (
      $1,$2,$3,$4,
      $5,$6,$7,
      $8,$9,
      $10,$11,$12,
      $13,false,
      $14,$15,$16,$17,$18,$19,$20,
      $21,$22
    )
    ON CONFLICT DO NOTHING
    `,
    [
      symbol, timeframe, type, color,
      entry, tp, sl,
      tsMs, tsMs,
      date_es, hora_es, timestamp_es,
      createdAt,
      slope, intercept, endy, dev, devlen, mid, len,
      operable, reason
    ]
  );

  //await sendTelegram({
  //  bot: "FIAT-PRO CHANNELS",
  //  symbol,
  //  timeframe,
  //  signalType: type,
  //  color,
  //  entry: Number(entry).toFixed(4),
  //  tp: Number(tp).toFixed(4),
  //  sl: Number(sl).toFixed(4),

    // 🔥 NOVETAT: si no operable → afegim la raó al missatge
  //  reason: operable ? "-" : reason
  //});
}
