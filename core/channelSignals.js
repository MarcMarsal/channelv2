// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

export function detectChannelEntry(candles, channel, stage) {
  if (!candles || candles.length === 0) {
    return {
      breakout: false,
      reingres: false,
      entrada: false,
      side: null
    };
  }

  const last = candles[candles.length - 1];
  const { upper, lower, mid } = channel;

  let breakout = false;
  let reingres = false;
  let entrada = false;
  let side = null;

  // 1️⃣ TRENCAMENT DEL CANAL (stage 0)
  if (stage === 0) {
    if (last.close > upper) {
      breakout = true;
      side = "upper";
    } else if (last.close < lower) {
      breakout = true;
      side = "lower";
    }
  }

  // 2️⃣ REINGRÉS (stage 1)
  if (stage === 1) {
    if (side === "upper" && last.close < upper) {
      reingres = true;
    }
    if (side === "lower" && last.close > lower) {
      reingres = true;
    }
  }

  // 3️⃣ ENTRADA (stage 2)
  if (stage === 2) {
    if (side === "upper" && last.close < mid) {
      entrada = true;
      side = "SHORT";
    }
    if (side === "lower" && last.close > mid) {
      entrada = true;
      side = "LONG";
    }
  }

  return {
    breakout,
    reingres,
    entrada,
    side
  };
}
