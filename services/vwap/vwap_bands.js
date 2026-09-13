// services/vwap/vwap_bands.js
// Descripció:
// Calcula les bandes institucionals ±1σ, ±2σ, ±3σ a partir del VWAP i la sigma.
// Fitxer matemàtic pur, sense dependències.

/**
 * Calcula bandes VWAP:
 * - upper1 / lower1 = ±1σ
 * - upper2 / lower2 = ±2σ
 * - upper3 / lower3 = ±3σ
 */
export function computeBands(vwapValue, sigmaValue) {
    return {
        upper1: vwapValue + sigmaValue,
        lower1: vwapValue - sigmaValue,

        upper2: vwapValue + sigmaValue * 2,
        lower2: vwapValue - sigmaValue * 2,

        upper3: vwapValue + sigmaValue * 3,
        lower3: vwapValue - sigmaValue * 3
    };
}
