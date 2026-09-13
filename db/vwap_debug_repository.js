// db/vwap_debug_repository.js
// Descripció:
// Insereix una fila completa de debug a la taula `vwap_debug`.
// Fitxer de base de dades FIAT PUR, sense lògica VWAP.

import { pool } from './postgres_pool.js';

/**
 * Insereix una fila de debug a PostgreSQL.
 */
export async function insertDebug(row) {
    const query = `
        INSERT INTO vwap_debug (
            symbol, timestamp,
            vwap, sigma,
            upper1, lower1,
            upper2, lower2,
            upper3, lower3,
            distance_absolute, distance_sigma, distance_percent,
            volume_current, volume_average, volume_relative,
            rev_outside_2sigma, rev_returning, rev_distance_decreasing, rev_valid,
            bo_crossed, bo_volume_high, bo_big_body, bo_momentum, bo_valid,
            rt_broken, rt_returned, rt_rejected, rt_valid,
            entry_type, entry_direction, entry_price, entry_timestamp,
            created_at
        )
        VALUES (
            $1, $2,
            $3, $4,
            $5, $6,
            $7, $8,
            $9, $10,
            $11, $12, $13,
            $14, $15, $16,
            $17, $18, $19, $20,
            $21, $22, $23, $24, $25,
            $26, $27, $28, $29,
            $30, $31, $32, $33,
            $34
        )
    `;

    const params = [
        row.symbol,
        row.timestamp,
        row.vwap,
        row.sigma,
        row.upper1, row.lower1,
        row.upper2, row.lower2,
        row.upper3, row.lower3,
        row.distance_absolute, row.distance_sigma, row.distance_percent,
        row.volume_current, row.volume_average, row.volume_relative,
        row.rev_outside_2sigma, row.rev_returning, row.rev_distance_decreasing, row.rev_valid,
        row.bo_crossed, row.bo_volume_high, row.bo_big_body, row.bo_momentum, row.bo_valid,
        row.rt_broken, row.rt_returned, row.rt_rejected, row.rt_valid,
        row.entry_type, row.entry_direction, row.entry_price, row.entry_timestamp,
        row.created_at
    ];

    await pool.query(query, params);
}
