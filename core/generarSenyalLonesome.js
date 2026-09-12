// generarSenyalLonesome.js — LonesomeTheBlue PUR (modular senyals)
import { formatSpainDate, formatSpainTime } from "./utils.js";
import { calcularAccioFIAT } from "./calcularAccioFIAT.js";
import { classifySlope } from "./logic/slope_direction.js";
import { isNoise } from "./logic/noise_detection.js";
import { detectCas } from "./logic/cas_detection.js";
import { shouldEnter } from "./logic/entry_validator.js";
import { calculateTpSl } from "./logic/tp_sl_calculation.js";
import { buildAlert } from "./logic/alert_builder.js";
import { insertSignal } from "./signals/insertSignal.js";

function safeStr(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function getSideFromAccio(accio) {
  if (!accio) return null;
  if (accio.includes("superior")) return "short";
  if (accio.includes("inferior")) return "long";
  return null;
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

  // 0) Canal operable?
  if (!canal || canal.operable === false) {
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
      alerta: "Canal no operable",
      prevAccio: null
    });
    return;
  }

  // 1) Acció FIAT (prev + last)
  const prevRaw = calcularAccioFIAT(
    prevCandle.open,
    prevCandle.close,
    canal.upper,
    canal.lower
  );
  const lastRaw = calcularAccioFIAT(
    closedCandle.open,
    closedCandle.close,
    canal.upper,
    canal.lower
  );

  const prevAccio = safeStr(prevRaw.accio);
  const lastAccio = safeStr(lastRaw.accio);

  const prevBreakoutAge = prevRaw.breakoutAge ?? null;
  const lastBreakoutAge = lastRaw.breakoutAge ?? null;

  const side = getSideFromAccio(lastAccio);

  // 1.a) Si és breakout → RAW
  if (lastAccio.includes("breakout")) {
    await insertSignal({
      symbol,
      type: "RAW",
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
      reason: null,
      alerta: "Breakout detectat",
      prevAccio
    });
    // no avaluem res més aquí
    return;
  }

  // 1.b) Si no hi ha acció → debug simple
  if (lastAccio === "") {
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
      alerta: "Acció buida",
      prevAccio
    });
    return;
  }

  // 2) Slope
  const { dir: slopeDir, arrow } = classifySlope(
    canal.slope,
    prevCandle.slope ?? canal.slope
  );

  // 3) Soroll
  const noise = isNoise(slopeDir, canal.dev);

  // 4) CAS
  const cas = detectCas(
    { accio: prevAccio, breakoutAge: prevBreakoutAge },
    { accio: lastAccio, breakoutAge: lastBreakoutAge },
    slopeDir,
    canal.dev
  );

  // 5) Avaluació inicial (EVALUATION)
  await insertSignal({
    symbol,
    type: "EVALUATION",
    stage: "reentry",
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
    reason: null,
    alerta: `Reingrés detectat, CAS ${cas}`,
    prevAccio
  });

  // 6) Decisió d’entrada
  const entra = shouldEnter(cas);

  if (!entra) {
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
      reason: `CAS_${cas}_no_entra`,
      alerta: `CAS ${cas} → no entrada`,
      prevAccio
    });
    return;
  }

  // 7) TP/SL
  const { tp, sl, rr } = calculateTpSl(cas, closedCandle, slopeDir);

  if (tp == null || sl == null) {
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
      alerta: "TP/SL invalid",
      prevAccio
    });
    return;
  }

  // 8) Alert text
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

  // 9) Senyal final TRADE
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
    prevAccio
  });
}
