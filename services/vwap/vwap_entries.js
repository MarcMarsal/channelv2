// services/vwap/vwap_entries.js
// Descripció:
// Decideix l’entrada final → si reversió / breakout / retest són vàlids → defineix tipus, direcció, preu i timestamp.
// Fitxer FIAT PUR, sense dependències.

/**
 * Detecta l’entrada final segons les condicions institucionals.
 * Retorna:
 * - entry_type: "reversal" | "breakout" | "retest" | null
 * - entry_direction: "long" | "short" | null
 * - entry_price: TP
 * - entry_timestamp
 */
export function detectEntry(conditions, tp, vwapValue, timestamp) {

    // 1) REVERSIÓ
    if (conditions.rev_valid) {
        const direction = tp < vwapValue ? "long" : "short";
        return {
            entry_type: "reversal",
            entry_direction: direction,
            entry_price: tp,
            entry_timestamp: timestamp
        };
    }

    // 2) BREAKOUT
    if (conditions.bo_valid) {
        const direction = tp > vwapValue ? "long" : "short";
        return {
            entry_type: "breakout",
            entry_direction: direction,
            entry_price: tp,
            entry_timestamp: timestamp
        };
    }

    // 3) RETEST
    if (conditions.rt_valid) {
        const direction = tp > vwapValue ? "long" : "short";
        return {
            entry_type: "retest",
            entry_direction: direction,
            entry_price: tp,
            entry_timestamp: timestamp
        };
    }

    // 4) Cap entrada
    return {
        entry_type: null,
        entry_direction: null,
        entry_price: null,
        entry_timestamp: null
    };
}
