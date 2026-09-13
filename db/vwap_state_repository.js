// db/vwap_state_repository.js
// Descripció:
// Accedeix a la taula `vwap_state` → carrega estat del dia → crea estat buit → guarda estat actualitzat.
// Fitxer de base de dades FIAT PUR, sense lògica VWAP.

// db/vwap_state_repository.js
// Estat VWAP FIAT PUR → JS usa UNIX ms, PostgreSQL rep YYYY-MM-DD

import { pool } from './postgres_pool.js';

/**
 * Retorna l’estat del dia per un símbol i data UTC.
 * IMPORTANT: dateUtc ha de ser YYYY-MM-DD per PostgreSQL.
 */
export async function getStateForDay(symbol, dateUtc) {
    const query = `
        SELECT *
        FROM vwap_state
        WHERE symbol = $1 AND date_utc = $2::date
        LIMIT 1
    `;

    const result = await pool.query(query, [symbol, dateUtc]);
    return result.rows[0] || null;
}

/**
 * Crea un estat buit per un nou dia.
 * Aquí mantenim UNIX ms (FIAT PUR per JS).
 */
export function createEmptyState(symbol, dateUtcMs) {
    return {
        symbol,
        date_utc: dateUtcMs,   // UNIX ms dins JS
        sum_pv: 0,
        sum_v: 0,
        sigma: 0,
        vwap: 0,
        candles_processed: 0,
        updated_at: Date.now()
    };
}

/**
 * Guarda l’estat actualitzat a PostgreSQL.
 * Convertim UNIX ms → YYYY-MM-DD just abans de guardar.
 */
export async function saveState(symbol, state, vwapValue, sigmaValue) {

    // FIAT PUR: convertir UNIX ms → YYYY-MM-DD per PostgreSQL
    const dateUtcSql = new Date(state.date_utc).toISOString().slice(0, 10);

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
        dateUtcSql,                 // <-- FIAT PUR per PostgreSQL
        state.sum_pv,
        state.sum_v,
        sigmaValue,
        vwapValue,
        state.candles_processed,
        state.updated_at
    ]);
}
