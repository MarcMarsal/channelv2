// core/generarSenyalLonesome.js — LonesomeTheBlue PUR (senyals FI + disparadors)

import { formatSpainDate, formatSpainTime } from "./utils.js";
import { classifySlope } from "./logic/slope_direction.js";
import { isNoise } from "./logic/noise_detection.js";
import { detectCas } from "./logic/cas_detection.js";
import { shouldEnter } from "./logic/entry_validator.js";
import { calculateTpSl } from "./logic/tp_sl_calculation.js";
import { buildAlert } from "./logic/alert_builder.js";
import { insertSignal } from "./signals/insertSignal.js";
import { fmt } from "./decimals.js";

function getSideFromAccio(accio) {
  if (!accio) return null;
  if (accio.includes("superior")) return "short";
  if (accio.includes("inferior")) return "long";
  return null;
}

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

  // -------------------------------------------------------------
  // 0) CANAL NO OPERABLE
  // -------------------------------------------------------------
  if (!canal || canal.operable === false) {
    const alerta = `Canal no operable (operable=false, reason=${canal?.reason || "null"})`;

    await insertSignal({
      symbol,
      type: "DISCARDED",
      stage: "evaluation",
      side: null,
      entry,
      tp: null,
      sl: null,
      timestamp,
      date_es,
      hora_es,
      timestamp_es,
      canal,
      cas: null,
      rr: null,
      reason: "canal_no_operable",
      alerta,
      prevAccio: null
    });
    return;
  }

  const lastAccio = canal.accio || "";
  const side = getSideFromAccio(lastAccio);

  // -------------------------------------------------------------
  // 1) BREAKOUT FIAT PUR
  // -------------------------------------------------------------
  if (lastAccio.includes("breakout")) {
    //  const alerta = `Breakout detectat (close=${entry}, canal=[${canal.lower}, ${canal.upper}])`;
  
    const alerta = `Breakout detectat (close=${fmt(entry, symbol)}, lower,upper=[${fmt(canal.lower, symbol)}, ${fmt(canal.upper, symbol)}])`;

    await insertSignal({
      symbol,
      type: "BREAKOUT",
      stage: "breakout",
      side,
      entry,
      tp: null,
      sl: null,
      timestamp,
      date_es,
      hora_es,
      timestamp_es,
      canal,
      cas: null,
      rr: null,
      reason: "breakout",
      alerta,
      prevAccio: null
    });
    return;
  }

  // -------------------------------------------------------------
  // 2) ACCIÓ BUIDA
  // -------------------------------------------------------------
  if (lastAccio === "") {
    const alerta = `Acció buida (accio="")`;

    await insertSignal({
      symbol,
      type: "DISCARDED",
      stage: "evaluation",
      side,
      entry,
      tp: null,
      sl: null,
      timestamp,
      date_es,
      hora_es,
      timestamp_es,
      canal,
      cas: null,
      rr: null,
      reason: "accio_buida",
      alerta,
      prevAccio: null
    });
    return;
  }

  // -------------------------------------------------------------
  // 3) SLOPE
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
    { accio: lastAccio, breakoutAge: null },
    { accio: lastAccio, breakoutAge: null },
    slopeDir,
    canal.dev
  );

  // -------------------------------------------------------------
  // 6) DECISIÓ D’ENTRADA
  // -------------------------------------------------------------
  const entra = shouldEnter(cas);

  if (!entra) {
    let motiu = `CAS_${cas}_no_entra`;
    let alerta = `NO ENTRA: CAS_${cas}_no_entra (cas=${cas})`;

    // canal estret
    if (canal.dev < 0.5) {
      motiu = "canal_estret";
      alerta = `NO ENTRA: canal_estret (dev=${canal.dev} < threshold=0.5)`;
    }

    // slope pla
    //if (Math.abs(canal.slope) < 0.0001) {
    //  motiu = "slope_pla";
    //  alerta = `NO ENTRA: slope_pla (abs(slope)=${Math.abs(canal.slope)} < minSlope=0.0001)`;
    //}

    await insertSignal({
      symbol,
      type: "DISCARDED",
      stage: "evaluation",
      side,
      entry,
      tp: null,
      sl: null,
      timestamp,
      date_es,
      hora_es,
      timestamp_es,
      canal,
      cas,
      rr: null,
      reason: motiu,
      alerta,
      prevAccio: null
    });
    return;
  }

  // -------------------------------------------------------------
  // 7) TP/SL
  // -------------------------------------------------------------
  const { tp, sl, rr } = calculateTpSl(cas, closedCandle, slopeDir);

  if (tp == null || sl == null) {
    const alerta = `TP/SL invalid (tp=${tp}, sl=${sl})`;

    await insertSignal({
      symbol,
      type: "DISCARDED",
      stage: "evaluation",
      side,
      entry,
      tp: null,
      sl: null,
      timestamp,
      date_es,
      hora_es,
      timestamp_es,
      canal,
      cas,
      rr: null,
      reason: "tp_sl_invalid",
      alerta,
      prevAccio: null
    });
    return;
  }

  // -------------------------------------------------------------
  // 8) ALERTA FINAL
  // -------------------------------------------------------------
  const alerta = buildAlert({
    slope: canal.slope,
    slopeDir,
    arrow,
    dev: canal.dev,
    isNoise: noise,
    prevAccio: null,
    lastAccio,
    cas,
    tp,
    sl
  });

  // -------------------------------------------------------------
  // 9) SENYAL FINAL
  // -------------------------------------------------------------
  await insertSignal({
    symbol,
    type: "TRADE",
    stage: "evaluation",
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
    reason: "entrada_valida",
    alerta,
    prevAccio: null
  });
}
