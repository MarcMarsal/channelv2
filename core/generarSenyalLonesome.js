// generarSenyalLonesome.js — LonesomeTheBlue PUR (versió final, adaptada a signals_channels)

import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

import { calcularAccioFIAT } from "./calcularAccioFIAT.js";
import { classifySlope } from "./logic/slope_direction.js";
import { isNoise } from "./logic/noise_detection.js";
import { detectCas } from "./logic/cas_detection.js";
import { shouldEnter } from "./logic/entry_validator.js";
import { calculateTpSl } from "./logic/tp_sl_calculation.js";
import { buildAlert } from "./logic/alert_builder.js";

// helpers seguretat
function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

// -------------------------------------------------------------
// GENERADOR PRINCIPAL LONESOME PUR
// -------------------------------------------------------------
export async function generarSenyalLonesome(
  symbol,
  timestamp,
  prevCandle,
  closedCandle,
  canal
) {
  const date_es = formatSpainDate(timestamp);
  const hora_es = formatSpainTime(timestamp);
  const timestamp_es = timestamp;
  const entry = closedCandle.close;

  // 1) Canal operable?
  if (!canal || canal.operable === false) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
      timestamp_es,
      date_es,
      hora_es,
      prevAccio: null,
      lastAccio: null,
      cas: null,
      slopeDir: null,
      arrow: null,
      noise: null,
      tp: null,
      sl: null,
      entry,
      entra: false,
      motiu: "canal_no_operable",
      alerta: "Canal no operable",
      canal,
      closedCandle
    });
  }

  // 2) Acció FIAT (breakout / reingrés)
  const prevAccio = safeStr(
    calcularAccioFIAT(
      prevCandle.open,
      prevCandle.close,
      canal.upper,
      canal.lower
    )
  );

  const lastAccio = safeStr(
    calcularAccioFIAT(
      closedCandle.open,
      closedCandle.close,
      canal.upper,
      canal.lower
    )
  );

  // si no hi ha acció (ni breakout ni reingres) → només debug
  if (lastAccio === "") {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
      timestamp_es,
      date_es,
      hora_es,
      prevAccio,
      lastAccio,
      cas: null,
      slopeDir: null,
      arrow: null,
      noise: null,
      tp: null,
      sl: null,
      entry,
      entra: false,
      motiu: "accio_buida",
      alerta: "Acció buida",
      canal,
      closedCandle
    });
  }

  // 3) Slope dir
  const { dir: slopeDir, arrow } = classifySlope(
    canal.slope,
    prevCandle.slope ?? canal.slope
  );

  // 4) Soroll
  const noise = isNoise(slopeDir, canal.dev);

  // 5) CAS
  const cas = detectCas(
    { accio: prevAccio },
    { accio: lastAccio },
    slopeDir,
    canal.dev
  );

  // 6) Decisió d’entrada
  const entra = shouldEnter(cas);

  if (!entra) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
      timestamp_es,
      date_es,
      hora_es,
      prevAccio,
      lastAccio,
      cas,
      slopeDir,
      arrow,
      noise,
      tp: null,
      sl: null,
      entry,
      entra: false,
      motiu: `CAS_${cas}_no_entra`,
      alerta: `CAS ${cas} → no entrada`,
      canal,
      closedCandle
    });
  }

  // 7) TP/SL Lonesome
  const { tp, sl } = calculateTpSl(cas, closedCandle, slopeDir);

  if (tp == null || sl == null) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
      timestamp_es,
      date_es,
      hora_es,
      prevAccio,
      lastAccio,
      cas,
      slopeDir,
      arrow,
      noise,
      tp: null,
      sl: null,
      entry,
      entra: false,
      motiu: "tp_sl_invalid",
      alerta: "TP/SL invalid",
      canal,
      closedCandle
    });
  }

  // 8) Alert text complet
  const alerta = buildAlert({
    slope: canal.slope,
    slopeDir,
    arrow,
    dev: canal.dev,
    isNoise: noise,
    prevAccio,
    lastAccio,
    cas,
    tp,
    sl
  });

  // 9) Senyal final (trade)
  return await guardarSenyalDebug({
    symbol,
    timestamp,
    timestamp_es,
    date_es,
    hora_es,
    prevAccio,
    lastAccio,
    cas,
    slopeDir,
    arrow,
    noise,
    tp,
    sl,
    entry,
    entra: true,
    motiu: "entrada_valida",
    alerta,
    canal,
    closedCandle
  });
}

// -------------------------------------------------------------
// GUARDAR SENYAL AMB TOT EL CONTEXT (DEBUG COMPLET)
// -------------------------------------------------------------
async function guardarSenyalDebug(data) {
  const {
    symbol,
    timestamp,
    timestamp_es,
    date_es,
    hora_es,
    prevAccio,
    lastAccio,
    cas,
    slopeDir,
    arrow,
    noise,
    tp,
    sl,
    entry,
    entra,
    motiu,
    alerta,
    canal
  } = data;

  const timestamp_ms = timestamp; // ja ve en ms al teu sistema

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
    prev_accio, cas, alerta
  ) VALUES (
    $1, '15m', $2, $3,
    $4, $5, $6,
    $7, $8,
    $9, $10, $11,
    EXTRACT(EPOCH FROM NOW()) * 1000, $12,
    $13, $14, $15, $16, $17, $18, $19,
    $20, $21, $22, $23, $24,
    $25, $26, $27,
    $28, $29,
    $30, $31, $32
  )
  `,
  [
    symbol,                         // 1
    safeStr(lastAccio) || "-",      // 2 type
    entra ? "blue" : "yellow",      // 3 color
    entry ?? null,                  // 4
    tp ?? null,                     // 5
    sl ?? null,                     // 6
    timestamp,                      // 7
    timestamp_ms,                   // 8
    date_es,                        // 9
    hora_es,                        // 10
    timestamp_es,                   // 11
    !entra,                         // 12 closed
    canal?.slope ?? null,           // 13
    canal?.intercept ?? null,       // 14
    canal?.endy ?? null,            // 15
    canal?.dev ?? null,             // 16
    canal?.devlen ?? null,          // 17
    canal?.mid ?? null,             // 18
    canal?.len ?? null,             // 19
    canal?.operable ?? true,        // 20
    motiu ?? canal?.reason ?? null, // 21
    null,                           // 22 stage
    null,                           // 23 rr
    null,                           // 24 result
    null,                           // 25 timestamp_exit
    null,                           // 26 price_exit
    null,                           // 27 duration_ms
    null,                           // 28 date_exit_es
    null,                           // 29 hora_exit_es
    prevAccio || null,              // 30
    cas ?? null,                    // 31
    alerta || null                  // 32
  ]
);


  return true;
}
