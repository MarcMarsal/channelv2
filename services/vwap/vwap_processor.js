// services/vwap/vwap_processor.js
// Càlcul VWAP FIAT PUR institucional:
// - rep l’estat actual
// - rep la última vela tancada
// - calcula tp, vwap i sigma
// - actualitza l’estat amb updated_at = candle.timestamp

import { updateState } from './vwap_state.js';

/**
 * Processa una vela tancada i retorna:
 *   - newState: estat actualitzat
 *   - vwap: valor VWAP actual
 *   - sigma: desviació absoluta del tp respecte al VWAP
 */
export function processCandle(state, candle) {
    const { high, low, close, volume, timestamp } = candle;

    // 🔥 FIAT PUR: Typical Price
    const tp = (high + low + close) / 3;

    // 🔥 FIAT PUR: actualitzar estat amb timestamp de la vela tancada
    const newState = updateState(state, tp, volume, timestamp);

    // 🔥 FIAT PUR: càlcul VWAP institucional
    const vwapValue = newState.sum_pv / newState.sum_v;

    // 🔥 FIAT PUR: sigma = distància absoluta entre tp i vwap
    const sigmaValue = Math.abs(tp - vwapValue);

    return { newState, vwap: vwapValue, sigma: sigmaValue };
}
