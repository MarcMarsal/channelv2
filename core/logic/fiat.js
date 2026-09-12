// core/logic/fiat.js

/**
 * Detecta breakout FIAT pur (sense mirar l'open)
 * c0 = canal actual (vela que acabem de tancar)
 */
export function detectBreakout(c0, close) {
  if (!c0 || typeof c0.upper !== "number" || typeof c0.lower !== "number") {
    return "";
  }

  if (close < c0.lower) {
    return "breakout_inferior";
  }

  if (close > c0.upper) {
    return "breakout_superior";
  }

  return "";
}

/**
 * Detecta reingrés institucional (1–2 veles després del breakout)
 * lastChannels = [c0, c1, c2]
 * - c1 = vela anterior
 * - c2 = vela de fa dues veles
 */
export function detectReingres(lastChannels, close) {
  if (!lastChannels || lastChannels.length < 2) return "";

  const [c0, c1, c2] = lastChannels;

  // Busquem breakout en -1 o -2
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

  // Reingrés superior → close torna per sota de l'upper del breakout
  if (breakoutType === "breakout_superior") {
    if (typeof upper === "number" && close < upper) {
      return "reingres_superior";
    }
  }

  // Reingrés inferior → close torna per sobre del lower del breakout
  if (breakoutType === "breakout_inferior") {
    if (typeof lower === "number" && close > lower) {
      return "reingres_inferior";
    }
  }

  return "";
}

/**
 * Funció principal que retorna l'acció FI del canal actual
 */
export function calcularAccioFI(lastChannels, close) {
  const [c0] = lastChannels || [];
  if (!c0) return "";

  // 1) Breakout sobre el canal actual
  const breakout = detectBreakout(c0, close);
  if (breakout) return breakout;

  // 2) Reingrés respecte al breakout de -1 o -2
  const reingres = detectReingres(lastChannels, close);
  if (reingres) return reingres;

  return "";
}
