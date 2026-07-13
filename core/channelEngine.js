// FIAT-PRO — Canal LonesomeTheBlue 100% igual a TradingView
export function getChannelFIAT(candles, len = 100, devlen = 2.0) {
  if (!candles || candles.length < len) return null;

  const window = candles.slice(-len);
  const src = window.map(c => Number(c.close));

  const n = len;

  // i = 0..n-1
  const meanX = (n - 1) / 2;
  const meanY = src.reduce((a, b) => a + b, 0) / n;

  // slope = cov(i, src) / var(i)
  let cov = 0;
  let varX = 0;

  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    cov += dx * (src[i] - meanY);
    varX += dx * dx;
  }

  const slope = cov / varX;

  // intercept = meanY - slope * meanX
  const intercept = meanY - slope * meanX;

  // endy = valor de la recta a la última barra
  const endy = intercept + slope * (n - 1);

  // DEV EXACTE DE TRADINGVIEW (recta invertida)
  let dev = 0;
  for (let i = 0; i < n; i++) {
    const fitted = slope * (n - i) + intercept;   // <-- CRÍTIC
    const diff = src[i] - fitted;
    dev += diff * diff;
  }
  dev = Math.sqrt(dev / n);

  return {
    intercept,
    endy,
    dev,
    slope,
    devlen,
    mid: meanY,
    len,
    lastClose: src[n - 1]
  };
}
