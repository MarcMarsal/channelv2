// core/channelEngine.js — FIAT 15m LonesomeTheBlue (versió definitiva)

export function getChannelFIAT(candles, len = 60, devlen = 1.6) {
  // 15m: mínim 60 veles
  if (!candles || candles.length < len) return null;

  // finestra de càlcul
  const window = candles.slice(-len);
  const src = window.map(c => Number(c.close));

  const n = len;

  // mitjanes
  const meanX = (n - 1) / 2;
  const meanY = src.reduce((a, b) => a + b, 0) / n;

  // regressió centrada (igual que TradingView)
  let cov = 0;
  let varX = 0;

  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    cov += dx * (src[i] - meanY);
    varX += dx * dx;
  }

  const slope = cov / varX;
  const intercept = meanY - slope * meanX;

  // valor final de la recta
  const endy = intercept + slope * (n - 1);

  // desviació EXACTA de TradingView (recta invertida)
  let dev = 0;
  for (let i = 0; i < n; i++) {
    const fitted = slope * (n - i) + intercept; // CRÍTIC
    const diff = src[i] - fitted;
    dev += diff * diff;
  }
  dev = Math.sqrt(dev / n);

  // FIAT 15m: suavitzat del slope per evitar soroll
  const slope_smooth = slope * 0.85;

  // FIAT 15m: dev ajustada per evitar punxaments falsos
  const dev_adj = dev * 0.92;

  return {
    intercept,
    endy,
    dev: dev_adj,
    slope: slope_smooth,
    devlen,
    mid: meanY,
    len,
    lastClose: src[n - 1]
  };
}
