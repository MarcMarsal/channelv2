// generarSenyalLonesome.js — LonesomeTheBlue PUR (senyals FI simplificats)
import { formatSpainDate, formatSpainTime } from "./utils.js";
import { classifySlope } from "./logic/slope_direction.js";
import { isNoise } from "./logic/noise_detection.js";
import { detectCas } from "./logic/cas_detection.js";
import { shouldEnter } from "./logic/entry_validator.js";
import { calculateTpSl } from "./logic/tp_sl_calculation.js";
import { buildAlert } from "./logic/alert_builder.js";
import { insertSignal } from "./signals/insertSignal.js";

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

  const lastAccio = canal.accio || "";
  const side = getSideFromAccio(lastAccio);

  // 1) Si és breakout → només RAW (sense duplicats)
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
      prevAccio: null
    });
    return;
  }

  // 2) Si no hi ha acció → discard amb motiu clar
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
      prevAccio: null
    });
    return;
  }

  // 3) Slope
  const { dir: slopeDir, arrow } = classifySlope(
    canal.slope,
    prevCandle.slope ?? canal.slope
  );

  // 4) Soroll
  const noise = isNoise(slopeDir, canal.dev);

  // 5) CAS (simplificat: només en funció de l'acció actual)
  const cas = detectCas(
    { accio: lastAccio, breakoutAge: null },
    { accio: lastAccio, breakoutAge: null },
    slopeDir,
    canal.dev
  );

  // 6) Decisió d’entrada
  const entra = shouldEnter(cas);

  if (!entra) {
    let motiu = `CAS_${cas}_no_entra`;

    if (canal.dev < 0.5) motiu = "canal_estret";
    if (Math.abs(canal.slope) < 0.0001) motiu = "slope_pla";

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
      alerta: `NO ENTRA: ${motiu}`,
      prevAccio: null
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
      prevAccio: null
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
    prevAccio: null,
    lastAccio,
    cas,
    tp,
    sl
  });

  // 9) Senyal final TRADE (únic insert per timestamp)
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
