// core/logic/cas_detection.js

import { isNoise } from "./noise_detection.js";

export function detectCas(prev, last, slopeDir, dev) {
  // CAS 1 — soroll (no trend o canal estret)
  if (isNoise(slopeDir, dev)) return 1;

  const p = (prev && typeof prev.accio === "string") ? prev.accio : "";
  const l = (last && typeof last.accio === "string") ? last.accio : "";

  const prevIsBreakout = p.startsWith("breakout");
  const lastIsReingres = l.startsWith("reingres");

  // breakoutAge ve de calcularAccioFIAT.js (memòria institucional)
  const age = prev?.breakoutAge ?? null;

  // -------------------------------------------------------------
  // PATCH INSTITUCIONAL — Reingrés immediat encara que age sigui null
  // -------------------------------------------------------------
  // Si la vela anterior és breakout i l'actual és reingrés → CAS 2
  // Encara que age no existeixi (null), perquè és un reingrés immediat.
  if (prevIsBreakout && lastIsReingres) {
    return 2;
  }

  // -------------------------------------------------------------
  // CAS 3 — reingrés immediat tardà (age 1–2)
  // Només s'activa si age existeix
  // -------------------------------------------------------------
  if (!prevIsBreakout && lastIsReingres && age !== null && age <= 2) {
    return 3;
  }

  // CAS tardà — descartat (age >= 3)
  return 0;
}
