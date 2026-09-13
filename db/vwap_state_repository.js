// db/vwap_state_repository.js
// FIAT PUR institucional:
// - date_utc = 'YYYY-MM-DD' (string)
// - updated_at = UNIX ms (timestamp de l’última vela tancada)
// - sense conversions estranyes
// - sense resets
// - sense lògica de timestamps off-grid

import { pool } from './postgres_pool.js';

/**
 * Retorna l’estat del dia per un símbol i data UTC (YYYY-MM-DD).
 */
export async function getStateForDay(symbol, dateUtc) {
    const query = `
        SELECT *
        FROM vwap_state
        WHERE symbol = $1
          AND date_utc = $2
        LIMIT 1
    `;

    const result = await pool.query(query, [symbol, dateUtc]);
    return result.rows[0] || null;
}

/**
 * Crea un estat buit per un nou dia.
 * dateUtc és un string 'YYYY-MM-DD'.
 */
export function createEmptyState(symbol, dateUtc) {
    return {
        symbol,
        date_utc: dateUtc,      // 🔥 FIAT PUR: string, no ms
        sum_pv: 0,
        sum_v: 0,
        sigma: 0,
        vwap: 0,
        candles_processed: 0,
        updated_at: null        // 🔥 Encara no hem processat cap vela
    };
}

/**
 * Guarda l’estat actualitzat a PostgreSQL.
 * updated_at és UNIX ms (timestamp de la última vela tancada).
 */
export async function saveState(symbol, state, vwapValue, sigmaValue) {
    const query = `
        INSERT INTO vwap_state (
            symbol, date_utc, sum_pv, sum_v, sigma, vwap, candles_processed, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (symbol, date_utc)
        DO UPDATE SET
            sum_pv = EXCLUDED.sum_pv,
            sum_v = EXCLUDED.sum_v,
            sigma = EXCLUDED.sigma,
            vwap = EXCLUDED.vwap,
            candles_processed = EXCLUDED.candles_processed,
            updated_at = EXCLUDED.updated_at
    `;

    await pool.query(query, [
        symbol,
        state.date_utc,          // 🔥 FIAT PUR: string YYYY-MM-DD
        state.sum_pv,
        state.sum_v,
        sigmaValue,
        vwapValue,
        state.candles_processed,
        state.updated_at         // 🔥 UNIX ms
    ]);
}
