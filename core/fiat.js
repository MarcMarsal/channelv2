// core/fiat.js — FIAT PUR 15m: breakout (metxa/cos) + reingrés + drifting

// -------------------------------------------------------------
// BREAKOUT FIAT PUR (metxa vs cos)
// -------------------------------------------------------------
export function detectarBreakoutFIAT(c0, closedCandle) {
  if (!c0 || !closedCandle) return "";

  const { upper, lower } = c0;
  const { high, low, close } = closedCandle;

  // BREAKOUT SUPERIOR METXA
  if (high > upper && close <= upper) {
    return "breakout_superior_metxa";
  }

  // BREAKOUT SUPERIOR COS
  if (close > upper) {
    return "breakout_superior_cos";
  }

  // BREAKOUT INFERIOR METXA
  if (low < lower && close >= lower) {
    return "breakout_inferior_metxa";
  }

  // BREAKOUT INFERIOR COS
  if (close < lower) {
    return "breakout_inferior_cos";
  }

  return "";
}


// -------------------------------------------------------------
// REINGRÉS FIAT PUR (igual que fins ara)
// -------------------------------------------------------------
export function detectarReingresFIAT(canalBreakout, prevClose, close) {
  if (!canalBreakout) return "";

  const uc = canalBreakout.upper;
  const lc = canalBreakout.lower;

  // Reingrés superior
  if (prevClose > uc && close <= uc && close >= lc) {
    return "reingres_superior";
  }

  // Reingrés inferior
  if (prevClose < lc && close >= lc && close <= uc) {
    return "reingres_inferior";
  }

  return "";
}


// -------------------------------------------------------------
// DRIFTING — mètxes repetides + cos petit + rang enganxat
// -------------------------------------------------------------
export function detectarDrifting(c0, closedCandle) {
  const { high, low, open, close } = closedCandle;

  const body = Math.abs(close - open);
  const range = high - low;
  const bodyPct = range > 0 ? body / range : 0;

  const nearUpper = high >= c0.upper * 0.995;
  const nearLower = low <= c0.lower * 1.005;

  const smallBody = bodyPct < 0.30;

  if ((nearUpper || nearLower) && smallBody) {
    return "drifting";
  }

  return "";
}


// -------------------------------------------------------------
// Funció principal FIAT PUR — circuit únic breakout + reingrés + drifting
// -------------------------------------------------------------
export function calcularAccioFI(lastChannels, closedCandle, macd, atr) {
  if (!lastChannels || lastChannels.length < 2) return "";

  const [c0, c1] = lastChannels;

  const close     = closedCandle.close;
  const prevClose = closedCandle.prev_close;

  // 1) BREAKOUT (metxa o cos)
  const breakout = detectarBreakoutFIAT(c0, closedCandle);
  if (breakout) return breakout;

  // 2) REINGRÉS (igual que fins ara)
  let canalBreakout = null;

  for (const ch of lastChannels.slice(0, 3)) {
    if (ch?.accio?.includes("breakout")) {
      canalBreakout = ch;
      break;
    }
  }

  if (canalBreakout) {
    const reingres = detectarReingresFIAT(canalBreakout, prevClose, close);
    if (reingres) return reingres;
  }

  // 3) DRIFTING (informatiu)
  const drifting = detectarDrifting(c0, closedCandle);
  if (drifting) return drifting;

  return "";
}
