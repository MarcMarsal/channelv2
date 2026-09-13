// 0) Canal no operable
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

// 1) Breakout → RAW (FIAT PUR)
if (lastAccio.includes("breakout")) {
  const alerta = `Breakout detectat (close=${entry}, canal=[${canal.lower}, ${canal.upper}])`;

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

// 2) Acció buida
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

// 6) CAS no entra
if (!entra) {
  let motiu = `CAS_${cas}_no_entra`;
  let alerta = `NO ENTRA: CAS_${cas}_no_entra (cas=${cas})`;

  // canal estret
  if (canal.dev < 0.5) {
    motiu = "canal_estret";
    alerta = `NO ENTRA: canal_estret (dev=${canal.dev} < threshold=0.5)`;
  }

  // slope pla
  if (Math.abs(canal.slope) < 0.0001) {
    motiu = "slope_pla";
    alerta = `NO ENTRA: slope_pla (abs(slope)=${Math.abs(canal.slope)} < minSlope=0.0001)`;
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
    prevAccio: null
  });
  return;
}

// 7) TP/SL invalid
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
