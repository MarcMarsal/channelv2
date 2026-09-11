// generarSenyalLonesome.js — LonesomeTheBlue PUR (adaptat a la taula real de signals_channels)

import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

import { calcularAccioFIAT } from "./calcularAccioFIAT.js";
import { classifySlope } from "./logic/slope_direction.js";
import { isNoise } from "./logic/noise_detection.js";
import { detectCas } from "./logic/cas_detection.js";
import { shouldEnter } from "./core/logic/entry_validator.js";
import { calculateTpSl } from "./logic/tp_sl_calculation.js";
import { buildAlert } from "./logic/alert_builder.js";

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

  // 1) Canal operable?
  if (!canal || !canal.operable) {
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
      entry: closedCandle.close,
      entra: false,
      motiu: "canal_no_operable",
      alerta: "Canal no operable",
      canal,
      closedCandle
    });
  }

  // 2) Acció FIAT (breakout / reingrés)
  const prevAccio = calcularAccioFIAT(
    prevCandle.open,
    prevCandle.close,
    canal.upper,
    canal.lower
  );

  const lastAccio = calcularAccioFIAT(
    closedCandle.open,
    closedCandle.close,
    canal.upper,
    canal.lower
  );

  if (!lastAccio) {
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
      entry: closedCandle.close,
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
      entry: closedCandle.close,
      entra: false,
      motiu: `CAS_${cas}_no_entra`,
      alerta: `CAS ${cas} → no entrada`,
      canal,
      closedCandle
    });
  }

  // 7) TP/SL Lonesome
  const { tp, sl } = calculateTpSl(cas, closedCandle, slopeDir);

  if (!tp || !sl) {
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
      entry: closedCandle.close,
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
  const entry = closedCandle.close;

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
      symbol,
      timeframe,
      type,
      color,
      entry,
      tp,
      sl,
      timestamp,
      timestamp_ms,
      date_es,
      hora_es,
      timestamp_es,
      created_at,
      closed,
      slope,
      intercept,
      endy,
      dev,
      devlen,
      mid,
      len,
      operable,
      reason,
      stage,
      rr,
      result,
      timestamp_exit,
      price_exit,
      duration_ms,
      date_exit_es,
      hora_exit_es,
      prev_accio,
      cas,
      alerta
    ) VALUES (
      $1, '15m', $2, $3,
      $4, $5, $6,
      $7, $8,
      $9, $10, $11,
      EXTRACT(EPOCH FROM NOW()) * 1000,
      $12,
      $13, $14, $15, $16, $17, $18, $19,
      $20, $21, $22, $23,
      NULL, NULL, NULL, NULL, NULL,
      $24, $25, $26
    )
  `,
    [
      symbol,                 // $1
      lastAccio || "-",       // $2 type
      entra ? "blue" : "yellow", // $3 color (trade vs info)
      entry,                  // $4
      tp,                     // $5
      sl,                     // $6
      timestamp,              // $7
      timestamp_ms,           // $8
      date_es,                // $9
      hora_es,                // $10
      timestamp_es,           // $11
      !entra,                 // $12 closed = true si NO entra
      canal?.slope ?? null,   // $13
      canal?.intercept ?? null, // $14
      canal?.endy ?? null,    // $15
      canal?.dev ?? null,     // $16
      canal?.devlen ?? null,  // $17
      canal?.mid ?? null,     // $18
      canal?.len ?? null,     // $19
      canal?.operable ?? true,// $20
      canal?.reason ?? null,  // $21
      null,                   // $22 stage
      null,                   // $23 rr
      prevAccio || null,      // $24
      cas || null,            // $25
      alerta || null          // $26
    ]
  );

  return true;
}
