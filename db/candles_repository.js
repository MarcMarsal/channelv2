// db/candles_repository.js
// Descripció:
// Accés FIAT PUR a la taula `candles`.
// - Obtenir l’última vela tancada (confirm = true)
// - Obtenir la vela oberta (confirm = false)
// Sense SINCE, sense timestamps off-grid, sense lògica VWAP.

import { pool } from './postgres_pool.js';

/**
 * Retorna l’última vela tancada (confirm = true) d’un símbol.
 * Aquesta és la vela que el bot ha de processar.
 */
export async function getLastClosedCandle(symbol) {
    const query = `
        SELECT symbol, timeframe, open, high, low, close, volume, timestamp, confirm
        FROM candles
        WHERE symbol = $1
          AND timeframe = '15m'
          AND confirm = true
        ORDER BY timestamp DESC
        LIMIT 1
    `;

    const result = await pool.query(query, [symbol]);
    return result.rows[0] || null;
}

/**
 * Retorna la vela oberta actual (confirm = false).
 * No es processa, només serveix per saber que vindrà una nova vela.
 */
export async function getOpenCandle(symbol) {
    const query = `
        SELECT symbol, timeframe, open, high, low, close, volume, timestamp, confirm
        FROM candles
        WHERE symbol = $1
          AND timeframe = '15m'
          AND confirm = false
        ORDER BY timestamp DESC
        LIMIT 1
    `;

    const result = await pool.query(query, [symbol]);
    return result.rows[0] || null;
}

