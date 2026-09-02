// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

import { getChannelFIAT } from "./channelEngine.js";

export function detectChannelEntry(candles, channel) {
  if (!candles || candles.length < channel.len) {
    return {
      punxada: false,
      reingres: false,
      entrada: false,
      side: null
    };
  }

  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2];

  const { upper, lower, mid } = channel;

  const punxadaLower = last.low < lower && prev.low >= lower;
  const punxadaUpper = last.high > upper && prev.high <= upper;
  const punxada = punxadaLower || punxadaUpper;

  const reingresLower = prev.low < lower && last.close > lower && last.close < mid;
  const reingresUpper = prev.high > upper && last.close < upper && last.close > mid;
  const reingres = reingresLower || reingresUpper;

  const entradaLower = prev.close > lower && last.close > lower && last.close < mid;
  const entradaUpper = prev.close < upper && last.close < upper && last.close > mid;
  const entrada = entradaLower || entradaUpper;

  let side = null;
  if (punxadaLower || reingresLower || entradaLower) side = "lower";
  if (punxadaUpper || reingresUpper || entradaUpper) side = "upper";

  // 🔧 FIAT SAFE: side mai pot ser null
  if (!side) {
    side = last.close < mid ? "lower" : "upper";
  }

  return {
    punxada,
    reingres,
    entrada,
    side
  };
}
