// core/channelSignals.js — FIAT 15m (punxada + reingrés + entrada)

export function detectChannelEntry(candles, channel, stage) {
  // stage pot ser:
  // "neutral" | "breakoutUpper" | "breakoutLower" | "reingresUpper" | "reingresLower"

  if (!candles || candles.length === 0) {
    return {
      breakout: false,
      reingres: false,
      entrada: false,
      side: null,
      stage
    };
  }

  const last = candles[candles.length - 1];
  const { upper, lower, mid } = channel;

  let breakout = false;
  let reingres = false;
  let entrada = false;
  let side = null;

  // 1️⃣ TRENCAMENT DEL CANAL (alerta)
  if (last.close > upper) {
    breakout = true;
    stage = "breakoutUpper";
  } else if (last.close < lower) {
    breakout = true;
    stage = "breakoutLower";
  }

  // 2️⃣ REINGRÉS (alerta)
  if (stage === "breakoutUpper" && last.close < upper) {
    reingres = true;
    stage = "reingresUpper";
  } else if (stage === "breakoutLower" && last.close > lower) {
    reingres = true;
    stage = "reingresLower";
  }

  // 3️⃣ ENTRADA (trade)
  if (stage === "reingresUpper" && last.close < mid) {
    entrada = true;
    side = "SHORT";
    stage = "neutral";
  } else if (stage === "reingresLower" && last.close > mid) {
    entrada = true;
    side = "LONG";
    stage = "neutral";
  }

  return {
    breakout,
    reingres,
    entrada,
    side,
    stage
  };
}
