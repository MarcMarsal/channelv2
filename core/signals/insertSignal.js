// core/signals/insertSignal.js
import { client } from "../../db/client.js";

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

export async function insertSignal({
  symbol,
  timeframe = "15m",
  type,
  stage,
  side,
  entry,
  tp,
  sl,
  timestamp,
  date_es,
  hora_es,
  timestamp_es,
  canal,
  cas,
  rr,
  reason,
  alerta,
  prevAccio,

  // 🔥 NOUS CAMPS FIAT
  macd,
  macd_signal,
  macd_hist,
  atr,
  accio_extesa,
  impuls_real,
  drifting_detectat
}) {
  const timestamp_ms = timestamp;

  await client.query(
    `
    INSERT INTO signals_channels (
      symbol, timeframe, type, color,
      entry, tp, sl,
      timestamp, timestamp_ms,
      date_es, hora_es, timestamp_es,
      created_at, closed,

      slope, intercept, endy, dev, devlen, mid, len,
      operable, reason, stage, rr, result,
      timestamp_exit, price_exit, duration_ms,
      date_exit_es, hora_exit_es,
      prev_accio, cas, alerta,

      -- 🔥 NOUS CAMPS FIAT
      macd, macd_signal, macd_hist,
      atr,
      accio_extesa,
      impuls_real,
      drifting_detectat
    ) VALUES (
      $1, $2, $3, $4,
      $5, $6, $7,
      $8, $9,
      $10, $11, $12,
      EXTRACT(EPOCH FROM NOW()) * 1000, $13,

      $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25,
      $26, $27, $28,
      $29, $30,
      $31, $32, $33,

      -- 🔥 NOUS CAMPS FIAT
      $34, $35, $36,
      $37,
      $38,
      $39,
      $40
    )
    `,
    [
      symbol,                      // 1
      timeframe,                   // 2
      safeStr(type),               // 3
      type === "TRADE" ? "blue"
        : type === "DISCARDED" ? "yellow"
        : "grey",                  // 4
      entry ?? null,               // 5
      tp ?? null,                  // 6
      sl ?? null,                  // 7
      timestamp,                   // 8
      timestamp_ms,                // 9
      date_es,                     // 10
      hora_es,                     // 11
      timestamp_es,                // 12
      type !== "TRADE",            // 13 closed

      canal?.slope ?? null,        // 14
      canal?.intercept ?? null,    // 15
      canal?.endy ?? null,         // 16
      canal?.dev ?? null,          // 17
      canal?.devlen ?? null,       // 18
      canal?.mid ?? null,          // 19
      canal?.len ?? null,          // 20

      canal?.operable ?? true,     // 21
      reason ?? canal?.reason ?? null, // 22
      stage ?? null,               // 23
      rr ?? null,                  // 24
      null,                        // 25 result
      null,                        // 26 timestamp_exit
      null,                        // 27 price_exit
      null,                        // 28 duration_ms
      null,                        // 29 date_exit_es
      null,                        // 30 hora_exit_es

      prevAccio || null,           // 31
      cas ?? null,                 // 32
      alerta || null,              // 33

      // 🔥 NOUS CAMPS FIAT
      macd ?? null,                // 34
      macd_signal ?? null,         // 35
      macd_hist ?? null,           // 36
      atr ?? null,                 // 37
      accio_extesa ?? null,        // 38
      impuls_real ?? null,         // 39
      drifting_detectat ?? null    // 40
    ]
  );
}
