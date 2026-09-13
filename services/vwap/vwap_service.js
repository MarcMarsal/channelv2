// services/vwap/vwap_service.js
// Flux institucional FIAT PUR complet:
// - TP
// - updateState
// - VWAP
// - sigma
// - bandes
// - distàncies
// - volum relatiu
// - condicions
// - entrada final
// - debug complet
// - guardar debug

import { typicalPrice, vwap as computeVWAP, sigma as computeSigma, distances, volumeRelative } from './vwap_math.js';
import { computeBands } from './vwap_bands.js';
import { evaluateConditions } from './vwap_conditions.js';
import { detectEntry } from './vwap_entries.js';
import { updateState } from './vwap_state.js';
import { buildDebugRow } from './vwap_debug.js';
import { insertDebug } from '../../db/vwap_debug_repository.js';

/**
 * Processa una vela tancada completa i retorna:
 * - estat actualitzat
 * - vwap
 * - sigma
 * - bandes
 * - distàncies
 * - volum relatiu
 * - condicions
 * - entrada
 */
export async function processClosedCandle(state, candle) {

    const { open, high, low, close, volume, timestamp } = candle;

    // 🔥 TP institucional
    const tp = typicalPrice(open, high, low, close);

    // 🔥 Actualitzar estat (sum_pv, sum_v, candles_processed, updated_at)
    const newState = updateState(state, tp, volume, timestamp);

    // 🔥 VWAP institucional
    const vwapValue = computeVWAP(newState.sum_pv, newState.sum_v);

    // 🔥 Sigma institucional
    const sigmaValue = computeSigma(newState, tp);

    // 🔥 Bandes institucionals
    const bands = computeBands(vwapValue, sigmaValue);

    // 🔥 Distàncies institucionals
    const dist = distances(tp, vwapValue, sigmaValue);

    // 🔥 Volum relatiu institucional
    const volumeInfo = volumeRelative(volume, newState);

    // 🔥 Condicions institucionals (reversió / breakout / retest)
    const conditions = evaluateConditions({
        tp,
        vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo,
        candle
    });

    // 🔥 Entrada institucional
    const entry = detectEntry(conditions, tp, vwapValue, timestamp);

    // 🔥 Debug complet
    const debugRow = buildDebugRow({
        symbol: state.symbol,
        timestamp,
        vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo,
        conditions,
        entry
    });

    // 🔥 Guardar debug
    await insertDebug(debugRow);

    return {
        state: newState,
        tp,
        vwap: vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo,
        conditions,
        entry
    };
}
