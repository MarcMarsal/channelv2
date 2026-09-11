// core/logic/cas_detection.js
import { isNoise } from "./noise_detection.js";

export function detectCas(prev, last) {
  // CAS 3 — soroll
  if (isNoise(prev, last)) return 3;

  const prevAccio = prev.accio || "";
  const lastAccio = last.accio || "";

  const prevIsBreakout = prevAccio.startsWith("breakout");
  const lastIsReingres = lastAccio.startsWith("reingres");

  // CAS 1 — breakout → reingrés immediat
  if (prevIsBreakout && lastIsReingres) return 1;

  // CAS 2 — reingrés tardà
  if (!prevIsBreakout && lastIsReingres) return 2;

  // No operable
  return 0;
}
