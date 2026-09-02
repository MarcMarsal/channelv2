// generarSenyalFIAT

import { client } from "../db/client.js";

export async function generarSenyalFIAT(symbol, timestamp, accio, open, close, upper, lower) {
    await client.query(`
        INSERT INTO signals_fiat (
            symbol, timestamp, accio, open, close, upper, lower, created_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            EXTRACT(EPOCH FROM NOW()) * 1000
        )
    `, [
        symbol, timestamp, accio, open, close, upper, lower
    ]);
}
