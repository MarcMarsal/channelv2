// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

import { getChannelFIAT } from "./channelEngine.js";

export function detectChannelEntry(candles, channel = null) {
  if (!candles || candles.length < 60) return null;

  // Canal FIAT 15m
  const ch = channel || getChannelFIAT(candles, 60, 1.6);
  if (!ch) return null;

  const { endy, dev, slope, devlen, lastClose, mid } = ch;
  const lastCandle = candles[candles.length - 1];

  // -------------------------------------------------------------
  // 1) DETECTAR PUNXADA (avis previ)
  // -------------------------------------------------------------
  const upper = endy + dev * devlen;
  const lower = endy - dev * devlen;

  let punxada = false;
  let side = null;

  if (lastClose > upper) {
    punxada = true;
    side = "upper";
  } else if (lastClose < lower) {
    punxada = true;
    side = "lower";
  }

  // Si hi ha punxada → avis groc
  if (punxada) {
    return {
      type: side === "upper" ? "SHORT" : "LONG",
      stage: "punxada",          // AVÍS PREVI
      entry: null,
      tp: null,
      sl: null,
      rr: null,
      timestamp: lastCandle.timestamp,
      color: "yellow",
      channel: ch
    };
  }

  // -------------------------------------------------------------
  // 2) DETECTAR REINGRÉS (entrada confirmada)
  // -------------------------------------------------------------
  // Reingrés = tancament dins del canal després d'haver estat fora
  const prevClose = candles[candles.length - 2].close;

  const prevWasOutside =
    prevClose > upper || prevClose < lower;

  const nowInside =
    lastClose <= upper && lastClose >= lower;

  if (!prevWasOutside || !nowInside) return null;

  // Direcció del trade
  const isShort = prevClose > upper;
  const isLong = prevClose < lower;

  if (!isLong && !isShort) return null;

  // -------------------------------------------------------------
  // 3) ENTRADA FIAT (tancament de reingrés)
  // -------------------------------------------------------------
  const entry = lastClose;

  // TP = midline
  const tp = mid;

  // SL = extrem + mètxa
  const wick = isLong
    ? Math.abs(prevClose - lower)
    : Math.abs(prevClose - upper);

  const sl = isLong
    ? lower - wick
    : upper + wick;

  // RR
  const rr = isLong
    ? (tp - entry) / (entry - sl)
    : (entry - tp) / (sl - entry);

  return {
    type: isLong ? "LONG" : "SHORT",
    stage: "entrada",           // ENTRADA CONFIRMADA
    entry,
    tp,
    sl,
    rr,
    timestamp: lastCandle.timestamp,
    color: "green",
    channel: ch
  };
}
