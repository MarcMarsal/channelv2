// core/logic/tp_sl_calculation.js — FIAT PUR dual (futures + spot)

export function calculateTpSl(cas, closedCandle, slopeDir, canal) {
  if (!canal) return { tp: null, sl_futures: null, sl_spot: null };

  const mid   = canal.mid;
  const upper = canal.upper;
  const lower = canal.lower;
  const dev   = canal.dev ?? 0;

  const accio = closedCandle.accio || "";

  let tp         = null;
  let sl_futures = null;
  let sl_spot    = null;

  // REINGRÉS FIAT PUR
  if (accio.startsWith("reingres")) {
    tp = mid;

    // FUTURS — SL curt institucional
    sl_futures = accio === "reingres_superior"
      ? upper
      : lower;

    // SPOT — SL ampliat
    sl_spot = accio === "reingres_superior"
      ? upper + dev
      : lower - dev;
  }

  // BREAKOUT FIAT PUR
  if (accio.startsWith("breakout")) {
    tp = accio === "breakout_superior"
      ? lower
      : upper;

    // FUTURS — SL curt institucional
    sl_futures = mid;

    // SPOT — SL ampliat
    sl_spot = accio === "breakout_superior"
      ? mid + dev
      : mid - dev;
  }

  return { tp, sl_futures, sl_spot };
}

