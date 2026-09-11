// tp_sl_calculation.js
// Pure Lonesome TP/SL logic (correct)

export function calculateTpSl(last, atr) {
  const { mid, upper, lower, close, accio } = last;

  let tp, sl;

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
