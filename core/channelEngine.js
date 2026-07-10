// core/channelEngine.js — FIAT Linear Regression Channel (LonesomeTheBlue)

export function getChannelFIAT(candles, len = 100, devlen = 2.0) {
  if (!candles || candles.length < len) return null;

  const window = candles.slice(-len);
  const src = window.map(c => Number(c.close));

  // mid = sum(src) / len
  const mid = src.reduce((a, b) => a + b, 0) / len;

  // slope via regressió lineal (equivalent a linreg diff)
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < len; i++) {
    const x = i;
    const y = src[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denom = (len * sumXX - sumX * sumX);
  if (denom === 0) return null;

  const slope = (len * sumXY - sumX * sumY) / denom;

  // intercept = mid - slope * floor(len/2) + ((1 - (len % 2)) / 2) * slope
  const half = Math.floor(len / 2);
  const intercept = mid - slope * half + ((1 - (len % 2)) / 2) * slope;

  // endy = intercept + slope * (len - 1)
  const endy = intercept + slope * (len - 1);

  // desviació
  let dev = 0;
  for (let x = 0; x < len; x++) {
    const fitted = slope * (len - x) + intercept;
    const diff = src[x] - fitted;
    dev += diff * diff;
  }
  dev = Math.sqrt(dev / len);

  return {
    intercept,   // y1_
    endy,        // y2_
    dev,
    slope,
    devlen,
    mid,
    len,
    lastClose: src[len - 1]
  };
}
