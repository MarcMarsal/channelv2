// core/logic/entry_validator.js
import { slopeMatchesReingresDirection } from "./slope_direction.js";

export function shouldEnter(cas, prev, last) {
  if (cas === 1) return true; // sempre

  if (cas === 2) {
    return slopeMatchesReingresDirection(last); // només si slope a favor
  }

  return false;
}
