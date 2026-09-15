// core/fiat.js — FIAT PUR breakout + reingrés + mean-reversion pur + wick-test

// -------------------------------------------------------------
// BREAKOUT FIAT PUR
// -------------------------------------------------------------
export function detectarBreakoutFIAT(canalActual, canalAnterior, prevClose, close) {
  if (!canalActual || !canalAnterior) return "";

  const ua  = canalActual.upper;
  const la  = canalActual.lower;

  const uaP = canalAnterior.upper;
  const laP = canalAnterior.lower;

  if (close > ua && prevClose <= uaP) return "breakout_superior";
  if (close < la && prevClose >= laP) return "breakout_inferior";

  return "";
}


// -------------------------------------------------------------
// REINGRÉS FIAT PUR
// -------------------------------------------------------------
export function detectarReingresFIAT(canalCongelat, prevClose, close) {
  if (!canalCongelat) return "";

  const uc = canalCongelat.upper;
  const lc = canalCongelat.lower;

  if (prevClose > uc && close <= uc) return "reingres_superior";
  if (prevClose < lc && close >= lc) return "reingres_inferior";

  return "";
}


// -------------------------------------------------------------
// WICK TEST — mètxa surt del canal però el close NO trenca
// -------------------------------------------------------------
export function detectarWickTest(c0, closedCandle) {
  const { high, low, close } = closedCandle;

  // Test superior: mètxa surt per dalt, però el close queda dins
  if (high > c0.upper && close < c0.upper) {
    return "wick_test_superior";
  }

  // Test inferior: mètxa surt per baix, però el close queda dins
  if (low < c0.lower && close > c0.lower) {
    return "wick_test_inferior";
  }

  return "";
}


// -------------------------------------------------------------
// DRIFTING — mètxes repetides + veles petites + rang enganxat
// -------------------------------------------------------------
export function detectarDrifting(c0, closedCandle) {
  const { high, low, open, close } = closedCandle;

  const body = Math.abs(close - open);
  const range = high - low;
  const bodyPct = body / range;

  const nearUpper = high >= c0.upper * 0.995;
  const nearLower = low <= c0.lower * 1.005;

  const smallBody = bodyPct < 0.30;

  if ((nearUpper || nearLower) && smallBody) return true;

  return false;
}


// -------------------------------------------------------------
// IMPULS REAL — cos ≥ 40% + direcció cap al mid + MACD + ATR
// -------------------------------------------------------------
export function detectarImpulsReal(c0, closedCandle, macd, atr) {
  const { high, low, open, close } = closedCandle;

  const body = Math.abs(close - open);
  const range = high - low;
  const bodyPct = body / range;

  if (bodyPct < 0.40) return false;

  const mid = c0.mid;

  const directionUp = close > open && close < mid;
  const directionDown = close < open && close > mid;

  if (!directionUp && !directionDown) return false;

  if (Math.abs(macd.hist) < Math.abs(macd.signal) * 0.5) return false;

  if (atr < (range * 0.5)) return false;

  return true;
}


// -------------------------------------------------------------
// MEAN‑REVERSION PUR — drifting → impuls real → gir cap al mid
// -------------------------------------------------------------
export function detectarMeanReversionPur(lastChannels, closedCandle, macd, atr) {
  if (!lastChannels || lastChannels.length < 1) return "";

  const c0 = lastChannels[0];

  const isDrifting = detectarDrifting(c0, closedCandle);
  if (!isDrifting) return "";

  const impuls = detectarImpulsReal(c0, closedCandle, macd, atr);
  if (!impuls) return "";

  const close = closedCandle.close;

  if (close < c0.mid) return "mean_reversion_pur_superior";
  if (close > c0.mid) return "mean_reversion_pur_inferior";

  return "";
}


// -------------------------------------------------------------
// Funció principal FIAT PUR + mean‑reversion pur + wick-test
// -------------------------------------------------------------
export function calcularAccioFI(lastChannels, closedCandle, macd, atr) {
  if (!lastChannels || lastChannels.length < 2) return "";

  const [c0, c1] = lastChannels;

  const close     = closedCandle.close;
  const prevClose = closedCandle.prev_close;

  // 1) BREAKOUT FIAT PUR
  const breakout = detectarBreakoutFIAT(c0, c1, prevClose, close);
  if (breakout) return breakout;

  // 2) REINGRÉS FIAT PUR
  let canalCongelat = null;

  for (const ch of lastChannels.slice(0, 3)) {
    if (ch?.accio?.includes("breakout")) {
      canalCongelat = ch;
      break;
    }
  }

  if (canalCongelat) {
    const reingres = detectarReingresFIAT(canalCongelat, prevClose, close);
    if (reingres) return reingres;
  }

  // 2.5) WICK TEST (avís institucional)
  const wick = detectarWickTest(c0, closedCandle);
  if (wick) return wick;

  // 3) MEAN‑REVERSION PUR
  const mrp = detectarMeanReversionPur(lastChannels, closedCandle, macd, atr);
  if (mrp) return mrp;

  return "";
}
