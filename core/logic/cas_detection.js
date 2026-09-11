// cas_detection.js
// Pure Lonesome CAS detection

import { isNoise } from "./noise_detection.js";

export function detectCas(prev, last, slopeDir, dev) {
  // CAS 1 — soroll (no trend o canal estret)
  if (isNoise(slopeDir, dev)) return 1;

  const prevAccio = prev.accio || "";
  const lastAccio = last.accio || "";

  const prevIsBreakout = prevAccio.startsWith("breakout");
  const lastIsReingres = lastAccio.startsWith("reingres");

  // CAS 2 — breakout + reingrés immediat
  if (prevIsBreakout && lastIsReingres) return 2;

  // CAS 3 — reingrés tardà
  if (!prevIsBreakout && lastIsReingres) return 3;

  return 0; // No trade context
}
