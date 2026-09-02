// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

import { getChannelFIAT } from "./channelEngine.js";

// core/channelSignals.js — FIAT LonesomeTheBlue (punxada + reingrés + entrada)

export function detectChannelEntry(candles, channel) {
  if (!candles || candles.length < channel.len) return null;

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const { upper, lower, mid } = channel;

  // -------------------------------------------------------------
  // 1) PUNXADA FIAT — confirmada (wick o close)
  // -------------------------------------------------------------
  const punxadaLower =
    last.low < lower && prev.low >= lower;   // travessa cap avall

  const punxadaUpper =
    last.high > upper && prev.high <= upper; // travessa cap amunt

  const punxada = punxadaLower || punxadaUpper;

  // -------------------------------------------------------------
  // 2) REINGRÉS FIAT — confirmat (tancament dins del canal)
  // -------------------------------------------------------------
  const reingresLower =
    prev.low < lower && last.close > lower && last.close < mid;

  const reingresUpper =
    prev.high > upper && last.close < upper && last.close > mid;

  const reingres = reingresLower || reingresUpper;

  // -------------------------------------------------------------
  // 3) ENTRADA FIAT — institucional (centre del canal)
  // -------------------------------------------------------------
  const entradaLower =
    prev.close > lower && last.close > lower && last.close < mid;

  const entradaUpper =
    prev.close < upper && last.close < upper && last.close > mid;

  const entrada = entradaLower || entradaUpper;

  // -------------------------------------------------------------
  // 4) SIDE FIAT — costat del canal
  // -------------------------------------------------------------
  let side = null;
  if (punxadaLower || reingresLower || entradaLower) side = "lower";
  if (punxadaUpper || reingresUpper || entradaUpper) side = "upper";

  // -------------------------------------------------------------
  // 5) RETORN FIAT — estructura institucional
  // -------------------------------------------------------------
  return {
    punxada,
    reingres,
    entrada,
    side
  };
}
