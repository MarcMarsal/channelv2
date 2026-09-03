// generarSenyalFIAT.js

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
    canal      // objecte amb slope, intercept, endy, dev, devlen, mid, len, operable, reason, stage, rr
) {
    const date_es = formatSpainDate(timestamp);
    const hora_es = formatSpainTime(timestamp);
    const timestamp_es = timestamp;

    const color = colorFIAT(accio);

    // Determinar si és trade (només reingressos)
    const isTrade =
        accio === "reingres_inferior" ||
        accio === "reingres_superior";

    // FIAT: entry/tp/sl segons LONG/SHORT
    let entry = null;
    let tp = null;
    let sl = null;

    if (accio === "reingres_inferior") {
        // LONG: reingrés per baix
        entry = open;
        tp    = upper;
        sl    = lower;
    }

    if (accio === "reingres_superior") {
        // SHORT: reingrés per dalt
        entry = open;
        tp    = lower;
        sl    = upper;
    }

    // Breakouts: només alerta, no trade
    // closed = true per breakout, false per reingrés (trade obert)
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
            $21
        )
    `, [
        symbol,
        accio,
        color,
        entry,
        tp,
        sl,
        timestamp,
        date_es,
        hora_es,
        timestamp_es,
        closed,
        canal.slope,
        canal.intercept,
        canal.endy,
        canal.dev,
        canal.devlen,
        canal.mid,
        canal.len,
        canal.operable,
        canal.reason,
        canal.stage || null,
        canal.rr || null
    ]);
}
