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
  sl_futures,     // 🔥 SL FUTURES (abans era sl)
  sl_spot,        // 🔥 SL SPOT (nou)
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
      entry, tp, sl, sl_spot,        -- 🔥 AFEGIT sl_spot
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
      $5, $6, $7, $8,               -- 🔥 sl_futures = $7, sl_spot = $8
      $9, $10,
      $11, $12, $13,
      EXTRACT(EPOCH FROM NOW()) * 1000, $14,

      $15, $16, $17, $18, $19, $20, $21,
      $22, $23, $24, $25, $26,
      $27, $28, $29,
      $30, $31,
      $32, $33, $34,

      -- 🔥 NOUS CAMPS FIAT
      $35, $36, $37,
      $38,
      $39,
      $40,
      $41
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
      sl_futures ?? null,          // 7  🔥 SL FUTURES
      sl_spot ?? null,             // 8  🔥 SL SPOT

      timestamp,                   // 9
      timestamp_ms,                // 10
      date_es,                     // 11
      hora_es,                     // 12
      timestamp_es,                // 13
      type !== "TRADE",            // 14 closed

      canal?.slope ?? null,        // 15
      canal?.intercept ?? null,    // 16
      canal?.endy ?? null,         // 17
      canal?.dev ?? null,          // 18
      canal?.devlen ?? null,       // 19
      canal?.mid ?? null,          // 20
      canal?.len ?? null,          // 21

      canal?.operable ?? true,     // 22
      reason ?? canal?.reason ?? null, // 23
      stage ?? null,               // 24
      rr ?? null,                  // 25
      null,                        // 26 result
      null,                        // 27 timestamp_exit
      null,                        // 28 price_exit
      null,                        // 29 duration_ms
      null,                        // 30 date_exit_es
      null,                        // 31 hora_exit_es

      prevAccio || null,           // 32
      cas ?? null,                 // 33
      alerta || null,              // 34

      // 🔥 NOUS CAMPS FIAT
      macd ?? null,                // 35
      macd_signal ?? null,         // 36
      macd_hist ?? null,           // 37
      atr ?? null,                 // 38
      accio_extesa ?? null,        // 39
      impuls_real ?? null,         // 40
      drifting_detectat ?? null    // 41
    ]
  );
}
