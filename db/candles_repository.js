// db/candles_repository.js
// Descripció:
// Llegeix veles de la taula `candles` → filtra per símbol i timeframe = '15m' → retorna veles ordenades per timestamp.
// Fitxer de base de dades FIAT PUR, sense lògica VWAP.

// db/candles_repository.js

import { pool } from './postgres_pool.js';

//export async function getCandlesSince(symbol, sinceTimestamp) {
//    const query = `
//        SELECT symbol, timeframe, open, high, low, close, volume, timestamp
//        FROM candles
//        WHERE symbol = $1
//          AND timeframe = '15m'
//          AND timestamp > $2
//        ORDER BY timestamp ASC
//    `;

//    const result = await pool.query(query, [symbol, sinceTimestamp]);

    // FIAT PUR: convertir timestamp string → number
    //return result.rows.map(row => ({
    //    ...row,
    //    timestamp: Number(row.timestamp)
    //}));
//}

export async function getCandlesSince(symbol, sinceTimestamp) {
    console.log("--------------------------------------------------");
    console.log("[DEBUG] getCandlesSince() INPUT:");
    console.log("symbol:", symbol);
    console.log("sinceTimestamp:", sinceTimestamp);
    console.log("sinceTimestamp ISO:", new Date(sinceTimestamp).toISOString());

    const query = `
        SELECT *
        FROM candles
        WHERE symbol = $1
        AND timestamp > $2
        ORDER BY timestamp ASC
    `;

    console.log("[DEBUG] SQL QUERY:", query);
    console.log("[DEBUG] SQL PARAMS:", [symbol, sinceTimestamp]);

    const result = await pool.query(query, [symbol, sinceTimestamp]);

    console.log("[DEBUG] SQL RESULT ROWS:", result.rows);
    console.log("--------------------------------------------------");

    return result.rows;
}


