// core/logic/tp_sl_calculation.js — versió final blindada

export function calculateTpSl(cas, closedCandle, slopeDir, canal) {
  if (!canal) return { tp: null, sl: null };

  const mid = canal.mid ?? null;
  const upper = canal.upper ?? null;
  const lower = canal.lower ?? null;
  const atr = canal.dev ?? 0;

  const accio = closedCandle.accio || "";

  if (mid == null || upper == null || lower == null) {
    return { tp: null, sl: null };
  }

  let tp = null;
  let sl = null;

  if (accio.startsWith("reingres")) {
    tp = mid;
    sl = accio === "reingres_superior"
      ? upper + atr
      : lower - atr;
  }

  if (accio.startsWith("breakout")) {
    tp = accio === "breakout_superior"
      ? lower
      : upper;

    sl = mid;
  }

  return { tp, sl };
}
