// services/vwap/vwap_state.js
// Estat VWAP FIAT PUR → sense strings de dates → tot en UNIX ms

import { getStateForDay, createEmptyState, saveState } from '../../db/vwap_state_repository.js';
import { isNewUtcDay } from '../../utils/time.js';

/**
 * Converteix un timestamp a l’inici del dia UTC (UNIX ms)
 */
function dayStartUtc(timestamp) {
    const d = new Date(timestamp);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime(); // número FIAT PUR
}

/**
 * Carrega l’estat del dia per un símbol i timestamp.
 */
export async function loadState(symbol, timestamp) {
    const dayUtc = dayStartUtc(timestamp);

    const existing = await getStateForDay(symbol, dayUtc);
    if (existing) return existing;

    // Estat buit FIAT PUR
    return createEmptyState(symbol, dayUtc);
}

/**
 * Reinicia l’estat si ha canviat el dia UTC.
 */
export function resetIfNewDay(state, timestamp) {
    const dayUtc = dayStartUtc(timestamp);

    if (!isNewUtcDay(state.date_utc, dayUtc)) return state;

    return {
        symbol: state.symbol,
        date_utc: dayUtc,
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
