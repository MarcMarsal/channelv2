// services/vwap/vwap_debug.js
// Descripció:
// Construeix l’objecte complet de debug → VWAP → sigma → bandes → distàncies → volum relatiu → condicions → entrada.
// Fitxer FIAT PUR, sense dependències.

/**
 * Construeix la fila completa per la taula vwap_debug.
 */
export function buildDebugRow({
    symbol,
    timestamp,
    vwapValue,
    sigma,
    bands,
    distances,
    volumeInfo,
    conditions,
    entry
}) {
    return {
        symbol,
        timestamp,

        // VWAP + sigma
        vwap: vwapValue,
        sigma,

        // Bandes
        upper1: bands.upper1,
        lower1: bands.lower1,
        upper2: bands.upper2,
        lower2: bands.lower2,
        upper3: bands.upper3,
        lower3: bands.lower3,

        // Distàncies
        distance_absolute: distances.distance_absolute,
        distance_sigma: distances.distance_sigma,
        distance_percent: distances.distance_percent,

        // Volum
        volume_current: volumeInfo.volume_current,
        volume_average: volumeInfo.volume_average,
        volume_relative: volumeInfo.volume_relative,

        // Condicions Reversió
        rev_outside_2sigma: conditions.rev_outside_2sigma,
        rev_returning: conditions.rev_returning,
        rev_distance_decreasing: conditions.rev_distance_decreasing,
        rev_valid: conditions.rev_valid,

        // Condicions Breakout
        bo_crossed: conditions.bo_crossed,
        bo_volume_high: conditions.bo_volume_high,
        bo_big_body: conditions.bo_big_body,
        bo_momentum: conditions.bo_momentum,
        bo_valid: conditions.bo_valid,

        // Condicions Retest
        rt_broken: conditions.rt_broken,
        rt_returned: conditions.rt_returned,
        rt_rejected: conditions.rt_rejected,
        rt_valid: conditions.rt_valid,

        // Entrada final
        entry_type: entry.entry_type,
        entry_direction: entry.entry_direction,
        entry_price: entry.entry_price,
        entry_timestamp: entry.entry_timestamp,

        // Timestamp de creació
        created_at: Date.now()
    };
}
