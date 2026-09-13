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
    // Logs FIAT PUR → una sola línia cadascun
    console.log("[DEBUG getCandlesSince] symbol:", symbol, 
                " sinceTimestamp:", sinceTimestamp, 
                " sinceISO:", new Date(sinceTimestamp).toISOString());

    const query = `
        SELECT *
        FROM candles
        WHERE symbol = $1
        AND timestamp > $2
        ORDER BY timestamp ASC
    `;

    // Query en UNA sola línia → Railway no la pot trencar
    console.log("[DEBUG QUERY]:", query.replace(/\s+/g, " "));

    // Paràmetres en UNA sola línia → Railway no els pot trencar
    const params = [symbol, sinceTimestamp];
    console.log("[DEBUG PARAMS]:", JSON.stringify(params));

    const result = await pool.query(query, params);

    // Resultat en UNA sola línia → Railway no el pot trencar
    console.log("[DEBUG RESULT ROWS]:", JSON.stringify(result.rows));

    return result.rows;
}

