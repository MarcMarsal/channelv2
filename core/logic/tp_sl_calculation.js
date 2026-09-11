// tp_sl_calculation.js
// Pure Lonesome TP/SL logic

export function calculateTpSl(cas, last, slopeDir) {
  const { upper, lower, mid, close } = last;

  let tp, sl;

  if (cas === 2) {
    // breakout + reingrés immediat
    if (slopeDir.startsWith("up")) {
      tp = mid;      // mean reversion
      sl = lower;    // breakout inferior
    } else {
      tp = mid;
      sl = upper;
    }
  }

  if (cas === 3) {
    // reingrés tardà
    tp = mid;        // Lonesome sempre apunta al midline
    sl = slopeDir.startsWith("up") ? lower : upper;
  }

  return { tp, sl };
}
