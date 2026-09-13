// core/logic/fiat.js — FIAT PUR breakout + reingrés

// -------------------------------------------------------------
// BREAKOUT FIAT PUR
// -------------------------------------------------------------
export function detectarBreakoutFIAT(canalActual, canalAnterior, prevClose, close) {
  if (!canalActual || !canalAnterior) return "";

  const ua  = canalActual.upper;
  const la  = canalActual.lower;

  const uaP = canalAnterior.upper;
  const laP = canalAnterior.lower;

  // Breakout superior
  if (close > ua && prevClose <= uaP) {
    return "breakout_superior";
  }

  // Breakout inferior
  if (close < la && prevClose >= laP) {
    return "breakout_inferior";
  }

  return "";
}


// -------------------------------------------------------------
// REINGRÉS FIAT PUR
// -------------------------------------------------------------
export function detectarReingresFIAT(canalCongelat, prevClose, close) {
  if (!canalCongelat) return "";

  const uc = canalCongelat.upper;
  const lc = canalCongelat.lower;

  // Reingrés superior
  if (prevClose > uc && close <= uc) {
    return "reingres_superior";
  }

  // Reingrés inferior
  if (prevClose < lc && close >= lc) {
    return "reingres_inferior";
  }

  return "";
}


// -------------------------------------------------------------
// Funció principal FIAT PUR
// -------------------------------------------------------------
export function calcularAccioFI(lastChannels, closedCandle) {
  if (!lastChannels || lastChannels.length < 2) return "";

  const [c0, c1] = lastChannels;   // c0 = canal actual, c1 = canal anterior

  const close     = closedCandle.close;
  const prevClose = closedCandle.prev_close;

  // 1) BREAKOUT FIAT PUR
  const breakout = detectarBreakoutFIAT(c0, c1, prevClose, close);
  if (breakout) {
    return breakout;   // el bot congelarà c0 com a canal del breakout
  }

  // -------------------------------------------------------------
  // 2) REINGRÉS FIAT PUR
  // Buscar breakout en els últims 3 canals confirmats
  // (breakout → vela post-breakout → reingrés)
  // -------------------------------------------------------------
  let canalCongelat = null;

  for (const ch of lastChannels.slice(0, 3)) {
    if (ch?.accio?.includes("breakout")) {
      canalCongelat = ch;
      break;
    }
  }

  if (!canalCongelat) return "";

  const reingres = detectarReingresFIAT(canalCongelat, prevClose, close);
  if (reingres) return reingres;

  return "";
}
