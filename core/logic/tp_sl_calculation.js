// tp_sl_calculation.js — versió final blindada

export function calculateTpSl(cas, closedCandle, slopeDir, canal) {
  const { mid, upper, lower, close } = canal;
  const accio = closedCandle.accio || "";
  const atr = canal.dev; // ATR real del canal FIAT

  let tp = null;
  let sl = null;

  // REINGRÉS (CAS 2 i CAS 3)
  if (accio.startsWith("reingres")) {
    tp = mid;
    sl = accio === "reingres_superior"
      ? upper + atr
      : lower - atr;
  }

  // BREAKOUT
  if (accio.startsWith("breakout")) {
    tp = accio === "breakout_superior"
      ? lower
      : upper;

    sl = mid;
  }

  return { tp, sl };
}
