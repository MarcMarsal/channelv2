// generarSenyalFIAT.js — FIAT LonesomeTheBlue (versió institucional)

import { client } from "../db/client.js";
import { formatSpainDate, formatSpainTime } from "./utils.js";

function colorFIAT(type) {
    if (type === "breakout_superior") return "red";
    if (type === "breakout_inferior") return "red";
    if (type === "reingres_inferior") return "blue";   // LONG
    if (type === "reingres_superior") return "blue";   // SHORT
    return "yellow";
}

export async function generarSenyalFIAT(
    symbol,
    timestamp,
    accio,      // breakout_superior / breakout_inferior / reingres_inferior / reingres_superior
    open,
    close,
    upper,
    lower,
    canal      // slope, intercept, endy, dev, devlen, mid, len, operable, reason, stage, rr
) {

    if (!canal) {
        console.log(`FIAT: canal undefined → no senyal per ${symbol}`);
        return;
    }

    if (canal.slope === undefined || canal.slope === null) {
        console.log(`FIAT: canal sense slope → no senyal per ${symbol}`);
        return;
    }

    if (!accio || accio === "") {
        console.log(`FIAT: sense acció → no senyal per ${symbol}`);
        return;
    }

    const date_es = formatSpainDate(timestamp);
    const hora_es = formatSpainTime(timestamp);
    const timestamp_es = timestamp;

    const color = colorFIAT(accio);

    // Només reingressos generen trade
    const isTrade =
        accio === "reingres_inferior" ||
        accio === "reingres_superior";

    let entry = null;
    let tp = null;
    let sl = null;

    if (accio === "reingres_inferior") {
        // LONG
        entry = open;
        tp    = upper;
        sl    = lower;
    }

    if (accio === "reingres_superior") {
        // SHORT
        entry = open;
        tp    = lower;
        sl    = upper;
    }

    // Breakouts → alerta (closed = true)
    // Reingressos → trade obert (closed = false)
    const closed = isTrade ? false : true;

    await client.query(`
        INSERT INTO signals_channels (
            symbol,
            timeframe,
            type,
            color,
            entry,
            tp,
            sl,
            timestamp,
            timestamp_ms,
            date_es,
            hora_es,
            timestamp_es,
            created_at,
            closed,
            slope,
            intercept,
            endy,
            dev,
            devlen,
            mid,
            len,
            operable,
            reason,
            stage,
            rr
        ) VALUES (
            $1, '15m', $2, $3,
            $4, $5, $6,
            $7, $7,
            $8, $9, $10,
            EXTRACT(EPOCH FROM NOW()) * 1000,
            $11,
            $12, $13, $14, $15, $16, $17,
            $18, $19,
            $20,
            $21,
            $22
        )
    `, [
        symbol,            // $1
        accio,             // $2
        color,             // $3
        entry,             // $4
        tp,                // $5
        sl,                // $6
        timestamp,         // $7
        date_es,           // $8
        hora_es,           // $9
        timestamp_es,      // $10
        closed,            // $11
        canal.slope,       // $12
        canal.intercept,   // $13
        canal.endy,        // $14
        canal.dev,         // $15
        canal.devlen,      // $16
        canal.mid,         // $17
        canal.len,         // $18
        canal.operable,    // $19
        canal.reason,      // $20
        canal.stage || null, // $21
        canal.rr || null     // $22
    ]);
}
