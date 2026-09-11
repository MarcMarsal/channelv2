// core/logic/noise_detection.js

export function isNoise(prev, last) {
  // Canal molt estret → soroll
  const widthPrev = Math.abs(prev.upper - prev.lower);
  const widthLast = Math.abs(last.upper - last.lower);

  const narrow = widthPrev < 0.003 && widthLast < 0.003;

  // Alternança breakout/reingres amb moviment mínim
  const alt =
    prev.accio?.startsWith("breakout") &&
    last.accio?.startsWith("reingres") &&
    Math.abs(prev.close - last.close) < widthLast * 0.2;

  return narrow && alt;
}
