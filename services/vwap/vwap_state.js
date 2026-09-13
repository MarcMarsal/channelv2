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
    return d.getTime();
}

/**
 * Carrega l’estat del dia per un símbol i timestamp.
 */
export async function loadState(symbol, timestamp) {
    const dateUtc = new Date(timestamp).toISOString().slice(0, 10);

    const existing = await getStateForDay(symbol, dateUtc);

    if (existing) {

        // 🔥 FIAT PUR: si l’estat és d’un altre dia → RESET
        if (existing.date_utc !== dateUtc) {
            return createEmptyState(symbol, dateUtc);
        }

        // 🔥 FIAT PUR: convertir date_utc correctament
        if (typeof existing.date_utc === "string") {
            const d = new Date(existing.date_utc + "T00:00:00Z");
            existing.date_utc = d.getTime();
        } else if (typeof existing.date_utc !== "number") {
            existing.date_utc = Date.now();
        }

        return existing;
    }

    // 🔥 Si no existeix estat → crear estat buit del dia actual
    return createEmptyState(symbol, dateUtc);
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
        updated_at: state.updated_at
    };
}

/**
 * Guarda l’estat actualitzat a la base de dades.
 */
export async function persistState(symbol, state, vwapValue, sigmaValue) {
    await saveState(symbol, state, vwapValue, sigmaValue);
}
