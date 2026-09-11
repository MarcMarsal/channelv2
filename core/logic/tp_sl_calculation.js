// core/logic/tp_sl_calculation.js
import { slopeMatchesReingresDirection } from "./slope_direction.js";

export function calculateTPSL(cas, prev, last) {
  const slopeFavor = slopeMatchesReingresDirection(last);

  const mid   = last.mid;
  const upper = last.upper;
  const lower = last.lower;

  const isSuperior = last.accio.includes("superior");

  let TP;

  if (cas === 1) {
    // CAS 1 — breakout → reingrés immediat
    if (slopeFavor) {
      TP = mid; // a favor → midline
    } else {
      TP = isSuperior
        ? (mid + upper) / 2
        : (mid + lower) / 2; // en contra → meitat
    }
  }

  if (cas === 2) {
    // CAS 2 — reingrés tardà → TP curt
    TP = mid;
  }

  // SL sempre al costat oposat del breakout
  const SL = isSuperior ? lower : upper;

  return { TP, SL };
}
