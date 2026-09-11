// core/logic/slope_direction.js

export function slopeMatchesReingresDirection(canal) {
  const slope = canal.slope;
  const isSuperior = canal.accio.includes("superior");

  // reingres_superior → moviment cap avall → SHORT
  if (isSuperior) {
    return slope < 0; // slope negatiu = tendència baixista
  }

  // reingres_inferior → moviment cap amunt → LONG
  return slope > 0; // slope positiu = tendència alcista
}
