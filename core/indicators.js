// core/indicators.js
// -------------------------------------------------------------
// MACD (12, 26, 9) + ATR(14) — FIAT PUR
// -------------------------------------------------------------

export function ema(values, length) {
  const k = 2 / (length + 1);
  let emaArray = [];
  let prevEma = values[0];

  emaArray.push(prevEma);

  for (let i = 1; i < values.length; i++) {
    const emaVal = values[i] * k + prevEma * (1 - k);
    emaArray.push(emaVal);
    prevEma = emaVal;
  }

  return emaArray;
}

// -------------------------------------------------------------
// MACD FIAT (12, 26, 9) — igual que TradingView
// -------------------------------------------------------------
export function calculateMACD(candles) {
  const closes = candles.map(c => Number(c.close));

  if (closes.length < 35) {
    return { macd: 0, signal: 0, hist: 0 };
  }

  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);

  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const hist = macdLine.map((v, i) => v - signalLine[i]);

  const last = macdLine.length - 1;

  return {
    macd: macdLine[last],
    signal: signalLine[last],
    hist: hist[last]
  };
}

// -------------------------------------------------------------
// ATR(14) — igual que TradingView
// -------------------------------------------------------------
export function calculateATR(candles, length = 14) {
  if (candles.length < length + 1) {
    return 0;
  }

  let trs = [];

  for (let i = 1; i < candles.length; i++) {
    const c0 = candles[i];
    const c1 = candles[i - 1];

    const high = Number(c0.high);
    const low = Number(c0.low);
    const prevClose = Number(c1.close);

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trs.push(tr);
  }

  const atr = trs.slice(-length).reduce((a, b) => a + b, 0) / length;
  return atr;
}
