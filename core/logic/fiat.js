// core/logic/fiat.js

// Breakout FIAT pur: només close vs canal actual
export function detectBreakout(canalActual, close) {
  if (!canalActual || typeof canalActual.upper !== "number" || typeof canalActual.lower !== "number") {
    return "";
  }

  if (close < canalActual.lower) return "breakout_inferior";
  if (close > canalActual.upper) return "breakout_superior";
  return "";
}

// Reingrés institucional: 1–2 veles després del breakout, canal del breakout congelat
export function detectReingres(lastChannels, close) {
  if (!lastChannels || lastChannels.length < 2) return "";

  // lastChannels ve de DB en ORDER BY timestamp DESC → [c0, c1, c2]
  const [c0, c1, c2] = lastChannels;

  let breakoutChannel = null;
  let breakoutType = "";

  if (c1?.accio === "breakout_superior" || c1?.accio === "breakout_inferior") {
    breakoutChannel = c1;
    breakoutType = c1.accio;
  } else if (c2?.accio === "breakout_superior" || c2?.accio === "breakout_inferior") {
    breakoutChannel = c2;
    breakoutType = c2.accio;
  }

  if (!breakoutChannel) return "";

  const { upper, lower } = breakoutChannel;

  if (breakoutType === "breakout_superior") {
    if (typeof upper === "number" && close < upper) return "reingres_superior";
  }

  if (breakoutType === "breakout_inferior") {
    if (typeof lower === "number" && close > lower) return "reingres_inferior";
  }

  return "";
}

// Funció principal: decideix acció per la vela tancada
export function calcularAccioFI(lastChannels, closedCandle) {
  const [c0] = lastChannels || [];
  if (!c0) return "";

  const close = closedCandle.close;

  // 1) breakout sobre canal actual
  const breakout = detectBreakout(c0, close);
  if (breakout) return breakout;

  // 2) reingrés respecte al breakout de -1 o -2
  const reingres = detectReingres(lastChannels, close);
  if (reingres) return reingres;

  return "";
}
