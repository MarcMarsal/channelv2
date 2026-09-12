// core/logic/alert_builder.js
// Full validation alert for debugging

export function buildAlert({
  slope,
  slopeDir,
  slopeArrow,
  dev,
  isNoise,
  prevAccio,
  lastAccio,
  cas,
  tp,
  sl
}) {
  return `
REINGRÉS DETECTAT

Slope: ${slope} (${slopeDir}) ${slopeArrow}
Desviació (dev): ${dev}
Soroll: ${isNoise ? "SÍ" : "NO"}

Acció anterior: ${prevAccio}
Acció actual: ${lastAccio}

CAS final: ${cas === 1 ? "CAS 1 — soroll"
            : cas === 2 ? "CAS 2 — breakout immediat"
            : cas === 3 ? "CAS 3 — reingrés tardà"
            : "CAS 0 — no context"}

TP: ${tp}
SL: ${sl}
`;
}
