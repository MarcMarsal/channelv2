// generarSenyalLonesome.js — LonesomeTheBlue pur

import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

import { calcularAccioFIAT } from "./calcularAccioFIAT.js";
import { classifySlope } from "./slope_direction.js";
import { isNoise } from "./noise_detection.js";
import { detectCas } from "./cas_detection.js";
import { shouldEnter } from "./core/logic/entry_validator.js";
import { calculateTpSl } from "./tp_sl_calculation.js";
import { buildAlert } from "./alert_builder.js";
import { buildSignal } from "./signal_builder.js";

export async function generarSenyalLonesome(
  symbol,
  timestamp,
  prevCandle,   // { open, close, upper, lower, accio? }
  lastCandle,   // { open, close, upper, lower, mid, slope, dev, ... }
  canal         // slope, intercept, endy, dev, devlen, mid, len, operable, reason
) {
  if (!canal || !canal.operable) {
    console.log(`Lonesome: canal no operable → no senyal per ${symbol}`);
    return;
  }

  if (canal.slope === undefined || canal.slope === null) {
    console.log(`Lonesome: canal sense slope → no senyal per ${symbol}`);
    return;
  }

  // 1) Acció FIAT (breakout/reingrés) per vela actual i anterior
  const prevAccio =
    prevCandle?.accio ??
    calcularAccioFIAT(prevCandle.open, prevCandle.close, canal.upper, canal.lower);

  const lastAccio =
    lastCandle.accio ??
    calcularAccioFIAT(lastCandle.open, lastCandle.close, canal.upper, canal.lower);

  if (!lastAccio) {
    console.log(`Lonesome: sense acció a la vela actual → no senyal per ${symbol}`);
    return;
  }

  // 2) Slope direction + arrow
  const { dir: slopeDir, arrow: slopeArrow } = classifySlope(canal.slope, prevCandle.slope ?? canal.slope);

  // 3) Soroll
  const noise = isNoise(slopeDir, canal.dev);

  // 4) CAS (1/2/3/0)
  const cas = detectCas(
    { accio: prevAccio },
    { accio: lastAccio },
    slopeDir,
    canal.dev
  );

  // 5) Regles d’entrada Lonesome pur
  const enter = shouldEnter(cas);
  if (!enter) {
    console.log(`Lonesome: CAS=${cas} → no entrada per ${symbol}`);
    return;
  }

  // 6) TP/SL Lonesome (funció ja validada)
  const { tp, sl } = calculateTpSl(cas, lastCandle, slopeDir);

  // 7) Alert text complet
  const alertText = buildAlert({
    slope: canal.slope,
    slopeDir,
    slopeArrow,
    dev: canal.dev,
    isNoise: noise,
    prevAccio,
    lastAccio,
    cas,
    tp,
    sl
  });

  // 8) Paquet de senyal
  const signal = buildSignal({ tp, sl, alertText });

  const date_es = formatSpainDate(timestamp);
  const hora_es = formatSpainTime(timestamp);
  const timestamp_es = timestamp;

  const closed = false; // Lonesome: només es guarda trade obert aquí

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
      prev_accio,
      cas,
      alert
    ) VALUES (
      $1, '15m', $2, $3,
      $4, $5, $6,
      $7, $7,
      $8, $9, $10,
      EXTRACT(EPOCH FROM NOW()) * 1000,
      $11,
      $12, $13, $14, $15, $16, $17,
      $18, $19,
      $20,
      $21,
      $22,
      $23,
      $24,
      $25
    )
  `,
    [
      symbol,                 // $1
      lastAccio,              // $2 (type)
      "blue",                 // $3 (color Lonesome trades)
      lastCandle.close,       // $4 entry (close)
      signal.tp,              // $5
      signal.sl,              // $6
      timestamp,              // $7
      date_es,                // $8
      hora_es,                // $9
      timestamp_es,           // $10
      closed,                 // $11
      canal.slope,            // $12
      canal.intercept,        // $13
      canal.endy,             // $14
      canal.dev,              // $15
      canal.devlen,           // $16
      canal.mid,              // $17
      canal.len,              // $18
      canal.operable,         // $19
      canal.reason,           // $20
      canal.stage || null,    // $21
      canal.rr || null,       // $22
      prevAccio || null,      // $23
      cas,                    // $24
      signal.alert            // $25
    ]
  );
}
