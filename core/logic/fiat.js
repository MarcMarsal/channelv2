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

