// fitxer core/logic/cas_detection.js

import { isNoise } from "./noise_detection.js";

export function detectCas(prev, last, slopeDir, dev) {
  // CAS 1 — soroll (no trend o canal estret)
  if (isNoise(slopeDir, dev)) return 1;

  const p = (prev && typeof prev.accio === "string") ? prev.accio : "";
  const l = (last && typeof last.accio === "string") ? last.accio : "";

  const prevIsBreakout = p.startsWith("breakout");
  const lastIsReingres = l.startsWith("reingres");

  // IMPORTANT: breakoutAge ve de calcularAccioFIAT.js (memòria institucional)
  const age = prev?.breakoutAge ?? null;

  // -------------------------------------------------------------
  // PATCH INSTITUCIONAL — Reingrés immediat (1–2 veles)
  // -------------------------------------------------------------

  // CAS 2 — breakout + reingrés immediat (age 0–2)
  if (prevIsBreakout && lastIsReingres && age !== null && age <= 2) {
    return 2;
  }

  // CAS 3 — reingrés immediat tardà (age 1–2)
  if (!prevIsBreakout && lastIsReingres && age !== null && age <= 2) {
    return 3;
  }

  // CAS tardà — descartat (age >= 3)
  return 0;
}
