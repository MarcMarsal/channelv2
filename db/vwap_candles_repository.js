// db/vwap_candles_repository.js
// Descripció:
// Llegeix veles de la taula `candles` → filtra per símbol i timeframe = '15m' → retorna veles ordenades per timestamp.
// Fitxer de base de dades FIAT PUR, sense lògica VWAP.

import { pool } from './postgres_pool.js';

/**
 * Retorna totes les veles 15m d’un símbol des d’un timestamp concret.
 */
export async function getCandlesSince(symbol, sinceTimestamp) {
    const query = `
        SELECT symbol, timeframe, open, high, low, close, volume, timestamp
        FROM candles
        WHERE symbol = $1
          AND timeframe = '15m'
          AND timestamp > $2
        ORDER BY timestamp ASC
    `;

    const result = await pool.query(query, [symbol, sinceTimestamp]);
    return result.rows;
}
