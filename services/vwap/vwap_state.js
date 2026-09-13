// services/vwap/vwap_state.js
// Descripció:
// Gestiona l’estat del dia → carrega estat → reinicia si és un nou dia → actualitza sumPV i sumV → incrementa candles_processades → retorna estat actualitzat.

import { getStateForDay, createEmptyState, saveState } from '../../db/vwap_state_repository.js';
import { isNewUtcDay } from '../../utils/time.js';

/**
 * Carrega l’estat del dia per un símbol i timestamp.
 */
export async function loadState(symbol, timestamp) {
    const dateUtc = new Date(timestamp).toISOString().slice(0, 10); // YYYY-MM-DD

    const existing = await getStateForDay(symbol, dateUtc);
    if (existing) return existing;

    // Si no existeix, crear estat buit
    return createEmptyState(symbol, dateUtc);
}

/**
 * Reinicia l’estat si ha canviat el dia UTC.
 */
export function resetIfNewDay(state, timestamp) {
    if (!isNewUtcDay(state.date_utc, timestamp)) return state;

    // Reiniciar estat del dia
    return {
        symbol: state.symbol,
        date_utc: new Date(timestamp).toISOString().slice(0, 10),
        sum_pv: 0,
        sum_v: 0,
        sigma: 0,
        vwap: 0,
        candles_processed: 0,
        updated_at: timestamp
    };
}

/**
 * Actualitza sumPV, sumV i incrementa candles_processades.
 */
export function updateState(state, tp, volume) {
    const newSumPV = state.sum_pv + tp * volume;
    const newSumV = state.sum_v + volume;

    return {
        ...state,
        sum_pv: newSumPV,
        sum_v: newSumV,
        candles_processed: state.candles_processed + 1,
        updated_at: Date.now()
    };
}

/**
 * Guarda l’estat actualitzat a la base de dades.
 */
export async function persistState(symbol, state, vwapValue, sigmaValue) {
    await saveState(symbol, state, vwapValue, sigmaValue);
}
