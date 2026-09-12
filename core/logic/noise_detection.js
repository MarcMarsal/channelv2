// core/logic/noise_detection.js
// Pure Lonesome noise detection

export function isNoise(slopeDir, dev, devThreshold = 0.0001) {
  const slopeIsFlat = slopeDir === "flat";
  const channelIsNarrow = dev < devThreshold;

  return slopeIsFlat || channelIsNarrow;
}
