// core/logic/tp_sl_calculation.js — FIAT PUR dual (futures + spot)

export function calculateTpSl(cas, closedCandle, slopeDir, canal) {
  if (!canal) return { tp: null, sl_futures: null, sl_spot: null };

  const mid   = canal.mid;
  const upper = canal.upper;
  const lower = canal.lower;
  const dev   = canal.dev ?? 0;

  // 🔥 FIAT PUR: acció extesa ve del CANAL, no de la vela
  const accio = canal.accio_extesa || canal.accio || "";

  let tp         = null;
  let sl_futures = null;
  let sl_spot    = null;

  // REINGRÉS FIAT PUR
  if (accio.startsWith("reingres")) {
    tp = mid;

    sl_futures = accio === "reingres_superior"
      ? upper
      : lower;

    sl_spot = accio === "reingres_superior"
      ? upper + dev
      : lower - dev;
  }

  // BREAKOUT FIAT PUR
  if (accio.startsWith("breakout")) {
    tp = accio.includes("superior")
      ? lower
      : upper;

    sl_futures = mid;

    sl_spot = accio.includes("superior")
      ? mid + dev
      : mid - dev;
  }

  return { tp, sl_futures, sl_spot };
}

