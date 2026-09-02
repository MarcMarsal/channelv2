import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

export async function generarSenyalFIAT(symbol, timestamp, accio, open, close, upper, lower) {

    const date_es = formatSpainDate(timestamp);
    const hora_es = formatSpainTime(timestamp);

    await client.query(`
        INSERT INTO signals_channels (
            symbol,
            timeframe,
            type,
            entry,
            tp,
            sl,
            timestamp,
            timestamp_ms,
            date_es,
            hora_es,
            created_at
        ) VALUES (
            $1, '15m', $2, $3, $4, $5,
            $6, $6, $7, $8,
            EXTRACT(EPOCH FROM NOW()) * 1000
        )
    `, [
        symbol,
        accio,
        open,
        upper,
        lower,
        timestamp,
        date_es,
        hora_es
    ]);
}
