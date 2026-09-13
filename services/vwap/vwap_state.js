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
/**
 * Carrega l’estat del dia per un símbol i timestamp.
 * Si existeix → el retorna convertint date_utc a UNIX ms.
 * Si no existeix → crea estat buit.
 */
export async function loadState(symbol, timestamp) {
    const dateUtc = new Date(timestamp).toISOString().slice(0, 10); // YYYY-MM-DD

    const existing = await getStateForDay(symbol, dateUtc);

    if (existing) {
        // FIAT PUR: convertir date_utc correctament segons el tipus
        if (typeof existing.date_utc === "string") {
            // Format SQL: "2026-09-13"
            const d = new Date(existing.date_utc + "T00:00:00Z");
            existing.date_utc = d.getTime();
        } else if (typeof existing.date_utc === "number") {
            // Ja és UNIX ms → deixar-ho tal qual
        } else {
            // Valor inesperat → reiniciar estat del dia
            existing.date_utc = Date.now();
        }

        return existing;
    }

    // Si no existeix, crear estat buit
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
        updated_at: Date.now()
    };
}

/**
 * Guarda l’estat actualitzat a la base de dades.
 */
export async function persistState(symbol, state, vwapValue, sigmaValue) {
    await saveState(symbol, state, vwapValue, sigmaValue);
}
