// generarSenyalLonesome.js — LonesomeTheBlue PUR (amb debug complet)

import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

import { calcularAccioFIAT } from "./calcularAccioFIAT.js";
import { classifySlope } from "./slope_direction.js";
import { isNoise } from "./noise_detection.js";
import { detectCas } from "./cas_detection.js";
import { shouldEnter } from "./core/logic/entry_validator.js";
import { calculateTpSl } from "./tp_sl_calculation.js";
import { buildAlert } from "./alert_builder.js";

// -------------------------------------------------------------
// GENERADOR PRINCIPAL
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

  // -------------------------------------------------------------
  // 1) VALIDACIONS BÀSIQUES
  // -------------------------------------------------------------
  if (!canal || !canal.operable) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
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

  // -------------------------------------------------------------
  // 2) ACCIÓ FIAT (breakout / reingrés)
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 3) SLOPE DIR
  // -------------------------------------------------------------
  const { dir: slopeDir, arrow } = classifySlope(
    canal.slope,
    prevCandle.slope ?? canal.slope
  );

  // -------------------------------------------------------------
  // 4) SOROLL
  // -------------------------------------------------------------
  const noise = isNoise(slopeDir, canal.dev);

  // -------------------------------------------------------------
  // 5) CAS
  // -------------------------------------------------------------
  const cas = detectCas(
    { accio: prevAccio },
    { accio: lastAccio },
    slopeDir,
    canal.dev
  );

  // -------------------------------------------------------------
  // 6) DECISIÓ D’ENTRADA
  // -------------------------------------------------------------
  const entra = shouldEnter(cas);

  if (!entra) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
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

  // -------------------------------------------------------------
  // 7) TP/SL LONESOME
  // -------------------------------------------------------------
  const { tp, sl } = calculateTpSl(cas, closedCandle, slopeDir);

  if (!tp || !sl) {
    return await guardarSenyalDebug({
      symbol,
      timestamp,
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

  // -------------------------------------------------------------
  // 8) ALERTA COMPLETA
  // -------------------------------------------------------------
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

  // -------------------------------------------------------------
  // 9) SENYAL FINAL (trade)
  // -------------------------------------------------------------
  const entry = closedCandle.close;

  return await guardarSenyalDebug({
    symbol,
    timestamp,
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
// FUNCIO AUXILIAR: GUARDAR SENYAL AMB TOT EL DEBUG
// -------------------------------------------------------------
async function guardarSenyalDebug(data) {
  const {
    symbol,
    timestamp,
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
    canal,
    closedCandle
  } = data;

  await client.query(
    `
    INSERT INTO signals_channels (
      symbol,
      timeframe,
      type,
      entry,
      tp,
      sl,
      timestamp,
      timestamp_ms,
      date_es,
      hora_es,
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
      prev_accio,
      cas,
      slope_dir,
      arrow,
      noise,
      entra,
      motiu,
      alert
    ) VALUES (
      $1, '15m', $2,
      $3, $4, $5,
      $6, $6,
      $7, $8,
      EXTRACT(EPOCH FROM NOW()) * 1000,
      $9,
      $10, $11, $12, $13, $14, $15, $16,
      $17, $18,
      $19, $20, $21, $22, $23, $24, $25
    )
  `,
    [
      symbol,                 // $1
      lastAccio || "-",       // $2
      entry,                  // $3
      tp,                     // $4
      sl,                     // $5
      timestamp,              // $6
      date_es,                // $7
      hora_es,                // $8
      !entra,                 // $9 closed = true si NO entra
      canal.slope,            // $10
      canal.intercept,        // $11
      canal.endy,             // $12
      canal.dev,              // $13
      canal.devlen,           // $14
      canal.mid,              // $15
      canal.len,              // $16
      canal.operable,         // $17
      canal.reason,           // $18
      prevAccio,              // $19
      cas,                    // $20
      slopeDir,               // $21
      arrow,                  // $22
      noise,                  // $23
      entra,                  // $24
      motiu,                  // $25
      alerta                  // $26
    ]
  );

  return true;
}
