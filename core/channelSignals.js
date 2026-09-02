// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

import { getChannelFIAT } from "./channelEngine.js";

export function detectChannelEntry(candles, channel = null) {
  if (!candles || candles.length < 60) return null;

  const ch = channel || getChannelFIAT(candles, 60, 1.6);
  if (!ch) return null;

  const { endy, dev, slope, devlen, lastClose, mid } = ch;
  const lastCandle = candles[candles.length - 1];

  const upper = endy + dev * devlen;
  const lower = endy - dev * devlen;

  // --- 1) Punxada ---
  if (lastClose > upper || lastClose < lower) {
    return {
      punxada: true,
      side: lastClose > upper ? "upper" : "lower",
      timestamp: lastCandle.timestamp,
      channel: ch
    };
  }

  // --- 2) Reingrés ---
  const prevClose = candles[candles.length - 2].close;

  const prevWasOutside = prevClose > upper || prevClose < lower;
  const nowInside = lastClose <= upper && lastClose >= lower;

  if (prevWasOutside && nowInside) {
    return {
      reingres: true,
      side: prevClose > upper ? "upper" : "lower",
      timestamp: lastCandle.timestamp,
      channel: ch
    };
  }

  return null;
}
