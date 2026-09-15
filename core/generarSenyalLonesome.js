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

  const macdObj = canal?.macd || {};
  const atrVal = canal?.atr ?? null;
  const lastAccio = canal?.accio || "";
  const accio_extesa = canal?.accio_extesa || lastAccio;
  const impuls_real = canal?.impuls_real || false;
  const drifting_detectat = canal?.drifting_detectat || false;

  // 0) CANAL NO OPERABLE
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
      prevAccio: null,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  const side = getSideFromAccio(lastAccio);

  // 1) BREAKOUT FIAT PUR
  if (lastAccio.includes("breakout")) {
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
      prevAccio: null,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  // 1.5) WICK TEST
  if (lastAccio.includes("wick_test")) {
    const alerta = `WICK TEST: mètxa ha punxat el canal sense trencar (close=${fmt(entry, symbol)})`;

    await insertSignal({
      symbol,
      type: "RAW",
      stage: "wick_test",
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
      reason: "wick_test",
      alerta,
      prevAccio: null,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  // 2) ACCIÓ BUIDA
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
      prevAccio: null,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  // 3) SLOPE
  const { dir: slopeDir, arrow } = classifySlope(
    canal.slope,
    prevCandle.slope ?? canal.slope
  );

  // 4) SOROLL
  const noise = isNoise(slopeDir, canal.dev);

  // 5) CAS FIAT — CRIDA CORRECTA
  const lastAccioFIAT = canal?.accio || "";
  const prevAccioFIAT = canal?.prev_accio || "";

  const cas = detectCas(
    { accio: prevAccioFIAT, breakoutAge: null },
    { accio: lastAccioFIAT, breakoutAge: null },
    slopeDir,
    canal.dev
  );

  // 6) DECISIÓ D’ENTRADA
  const entra = shouldEnter(cas);
  const amplada_relativa = (canal.upper - canal.lower) / canal.mid;

  if (!entra) {
    let motiu = `CAS_${cas}_no_entra`;
    let alerta = `NO ENTRA: CAS_${cas}_no_entra (cas=${cas})`;

    if (amplada_relativa < 0.003) {
      motiu = "canal_massa_estret";
      alerta = `NO ENTRA: canal massa estret (amplada_relativa=${amplada_relativa.toFixed(4)} < 0.003)`;
    } else if (amplada_relativa > 0.06) {
      motiu = "canal_massa_ample";
      alerta = `NO ENTRA: canal massa ample (amplada_relativa=${amplada_relativa.toFixed(4)} > 0.06)`;
    }

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
      prevAccio: prevAccioFIAT,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  // 7) TP/SL
  //const { tp, sl, rr } = calculateTpSl(cas, closedCandle, slopeDir);
  const { tp, sl_futures, sl_spot } = calculateTpSl(cas, closedCandle, slopeDir, canal);


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
      prevAccio: prevAccioFIAT,
      macd: macdObj.macd ?? null,
      macd_signal: macdObj.signal ?? null,
      macd_hist: macdObj.hist ?? null,
      atr: atrVal,
      accio_extesa,
      impuls_real,
      drifting_detectat
    });
    return;
  }

  // 8) ALERTA FINAL
  const alerta = buildAlert({
    slope: canal.slope,
    slopeDir,
    arrow,
    dev: canal.dev,
    isNoise: noise,
    prevAccio: prevAccioFIAT,
    lastAccio,
    cas,
    tp,
    sl
  });

  // 9) SENYAL FINAL
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
    prevAccio: prevAccioFIAT,
    macd: macdObj.macd ?? null,
    macd_signal: macdObj.signal ?? null,
    macd_hist: macdObj.hist ?? null,
    atr: atrVal,
    accio_extesa,
    impuls_real,
    drifting_detectat
  });
}
