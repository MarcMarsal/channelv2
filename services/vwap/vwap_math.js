// services/vwap/vwap_math.js
// Descripció:
// Calcula TP → VWAP → sigma → distàncies → volum relatiu.
// Tot matemàtic, sense dependències, FIAT PUR.

/**
 * Typical Price (TP)
 * TP = (high + low + close) / 3
 */
export function typicalPrice(open, high, low, close) {
    return (high + low + close) / 3;
}

/**
 * VWAP = sum(PV) / sum(V)
 */
export function vwap(sumPV, sumV) {
    if (sumV === 0) return 0;
    return sumPV / sumV;
}

/**
 * Sigma (desviació estàndard institucional)
 * FIAT PUR:
 * sigma = |TP - VWAP|
 * (No fem servir stddev estadística, sinó desviació real del TP)
 */
export function sigma(state, tp) {
    if (state.candles_processed === 0) return 0;
    const currentVWAP = vwap(state.sum_pv, state.sum_v);
    return Math.abs(tp - currentVWAP);
}

/**
 * Distàncies entre TP i VWAP
 * - absoluta
 * - en sigma
 * - en percentatge
 */
export function distances(tp, vwapValue, sigmaValue) {
    const abs = tp - vwapValue;
    const sigmaDist = sigmaValue === 0 ? 0 : abs / sigmaValue;
    const percent = vwapValue === 0 ? 0 : abs / vwapValue;

    return {
        distance_absolute: abs,
        distance_sigma: sigmaDist,
        distance_percent: percent
    };
}

/**
 * Volum relatiu
 * FIAT PUR:
 * - volum actual
 * - volum mitjà del dia (sumV / candles)
 * - volum relatiu = volum_actual / volum_mitjà
 */
export function volumeRelative(volumeCurrent, state) {
    const avgVolume =
        state.candles_processed === 0
            ? 0
            : state.sum_v / state.candles_processed;

    const rel = avgVolume === 0 ? 0 : volumeCurrent / avgVolume;

    return {
        volume_current: volumeCurrent,
        volume_average: avgVolume,
        volume_relative: rel
    };
}
