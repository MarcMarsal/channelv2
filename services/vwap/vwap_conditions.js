// services/vwap/vwap_conditions.js
// Descripció:
// Avalua condicions institucionals → reversió → breakout → retest → retorna booleans per cada condició.
// Fitxer pur de lògica, sense dependències externes.

/**
 * Condicions de REVERSIÓ:
 * - TP fora de ±2σ
 * - TP retornant cap al VWAP
 * - distància decreixent
 */
function checkReversal({ tp, vwapValue, sigma, distances }) {
    const outside2sigma =
        tp > vwapValue + sigma * 2 ||
        tp < vwapValue - sigma * 2;

    const returning =
        (tp > vwapValue && distances.distance_absolute < 0) ||
        (tp < vwapValue && distances.distance_absolute > 0);

    const decreasingDistance =
        Math.abs(distances.distance_absolute) < Math.abs(distances.distance_sigma * sigma);

    const valid =
        outside2sigma &&
        returning &&
        decreasingDistance;

    return {
        rev_outside_2sigma: outside2sigma,
        rev_returning: returning,
        rev_distance_decreasing: decreasingDistance,
        rev_valid: valid
    };
}

/**
 * Condicions de BREAKOUT:
 * - TP trenca ±1σ
 * - volum relatiu alt
 * - cos de la vela gran (momentum)
 */
function checkBreakout({ tp, vwapValue, sigma, bands, volumeInfo, candle }) {
    const crossed =
        tp > bands.upper1 ||
        tp < bands.lower1;

    const volumeHigh =
        volumeInfo.volume_relative >= 1.5;

    const bigBody =
        Math.abs(candle.close - candle.open) >= sigma * 0.7;

    const momentum =
        bigBody && volumeHigh;

    const valid =
        crossed &&
        momentum;

    return {
        bo_crossed: crossed,
        bo_volume_high: volumeHigh,
        bo_big_body: bigBody,
        bo_momentum: momentum,
        bo_valid: valid
    };
}

/**
 * Condicions de RETEST:
 * - breakout previ
 * - TP torna a ±1σ
 * - TP és rebutjat (wick)
 */
function checkRetest({ tp, bands, candle }) {
    const broken =
        tp > bands.upper1 ||
        tp < bands.lower1;

    const returned =
        tp <= bands.upper1 &&
        tp >= bands.lower1;

    const rejected =
        Math.abs(candle.high - candle.close) > Math.abs(candle.close - candle.open) ||
        Math.abs(candle.close - candle.low) > Math.abs(candle.close - candle.open);

    const valid =
        broken &&
        returned &&
        rejected;

    return {
        rt_broken: broken,
        rt_returned: returned,
        rt_rejected: rejected,
        rt_valid: valid
    };
}

/**
 * Funció principal:
 * Avalua totes les condicions i retorna un objecte complet.
 */
export function evaluateConditions(data) {
    const reversal = checkReversal(data);
    const breakout = checkBreakout(data);
    const retest = checkRetest(data);

    return {
        ...reversal,
        ...breakout,
        ...retest
    };
}
