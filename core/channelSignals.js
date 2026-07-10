// core/channelSignals.js — entrades FIAT (extrems cap al centre)

import { getChannelFIAT } from "./channelEngine.js";

export function detectChannelEntry(candles, len = 100, devlen = 2.0) {
  if (!candles || candles.length < len) return null;

  const channel = getChannelFIAT(candles, len, devlen);
  if (!channel) return null;

  const { endy: y2_, dev, slope, devlen: dmult, lastClose } = channel;
  const lastCandle = candles[candles.length - 1];

  // outofchannel literal de LonesomeTheBlue
  let outofchannel = -1;

  if (slope > 0 && lastClose < y2_ - dev * dmult) outofchannel = 0;   // trencament per sota
  else if (slope < 0 && lastClose > y2_ + dev * dmult) outofchannel = 2; // trencament per sobre

  if (outofchannel === -1) return null;

  const isLong = outofchannel === 0 && slope > 0;
  const isShort = outofchannel === 2 && slope < 0;

  if (!isLong && !isShort) return null;

  const entry = lastClose;

  // TP = regressió al final del canal (y2_)
  const tp = y2_;

  // SL = banda oposada (invalidació simple)
  const sl = isLong
    ? y2_ - dev * dmult
    : y2_ + dev * dmult;

  return {
    type: isLong ? "LONG" : "SHORT",
    entry,
    tp,
    sl,
    timestamp: lastCandle.timestamp,
    color: isLong ? "lime" : "red",
    channel
  };
}
