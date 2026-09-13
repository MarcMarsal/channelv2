// services/vwap/vwap_state.js
// Estat VWAP FIAT PUR per al nou flux institucional:
// - Cada dia s’identifica per date_utc (YYYY-MM-DD)
// - updated_at = timestamp de l’última vela tancada
// - Sense SINCE, sense Date.now(), sense resets estranys

import { getStateForDay, createEmptyState, saveState } from '../../db/vwap_state_repository.js';

/**
 * Carrega l’estat del dia per un símbol i una data UTC (YYYY-MM-DD).
 * Si no existeix, crea un estat buit.
 */
export async function loadState(symbol, dateUtc) {
    const existing = await getStateForDay(symbol, dateUtc);

    if (existing) {
        return existing;
    }

    // Estat buit per al dia
    return createEmptyState(symbol, dateUtc);
}

/**
 * Actualitza sum_pv, sum_v, candles_processed i updated_at
 * amb la informació de la vela tancada.
 */
export function updateState(state, tp, volume, candleTimestamp) {
    const newSumPV = state.sum_pv + tp * volume;
    const newSumV = state.sum_v + volume;

    return {
        ...state,
        sum_pv: newSumPV,
        sum_v: newSumV,
        candles_processed: state.candles_processed + 1,
        updated_at: candleTimestamp   // 🔥 FIAT PUR: timestamp de l’última vela tancada
    };
}

/**
 * Guarda l’estat actualitzat a la base de dades.
 */
export async function persistState(symbol, state, vwapValue, sigmaValue) {
    await saveState(symbol, state, vwapValue, sigmaValue);
}
