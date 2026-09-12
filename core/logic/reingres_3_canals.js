// reingres_3_canals.js

/**
 * Detecta reingrés institucional mirant els 3 últims canals tancats.
 *
 * @param {Array} lastChannels - array de canals ordenats del més recent al més antic.
 *   Cada canal ha de tenir: { upper, lower, accio }
 * @param {number} closePrice - close de la vela actual.
 * @returns {string} - "reingres_superior", "reingres_inferior" o "" si no hi ha reingrés.
 */
export function detectReingres3Canals(lastChannels, closePrice) {
  if (!lastChannels || lastChannels.length === 0) return "";

  const [c0, c1, c2] = lastChannels;

  const channels = [c0, c1, c2].filter(Boolean);

  // 1) Mirem si hi ha breakout recent (en algun dels 3 canals)
  const hasBreakoutSuperior = channels.some(c =>
    typeof c.accio === "string" && c.accio.includes("breakout_superior")
  );

  const hasBreakoutInferior = channels.some(c =>
    typeof c.accio === "string" && c.accio.includes("breakout_inferior")
  );

  // 2) Si hi ha breakout superior → reingrés si CLOSE < UPPER d'almenys un dels 3 canals
  if (hasBreakoutSuperior) {
    const insideAnyUpper = channels.some(c =>
      typeof c.upper === "number" && closePrice < c.upper
    );
    if (insideAnyUpper) {
      return "reingres_superior";
    }
  }

  // 3) Si hi ha breakout inferior → reingrés si CLOSE > LOWER d'almenys un dels 3 canals
  if (hasBreakoutInferior) {
    const insideAnyLower = channels.some(c =>
      typeof c.lower === "number" && closePrice > c.lower
    );
    if (insideAnyLower) {
      return "reingres_inferior";
    }
  }

  return "";
}
