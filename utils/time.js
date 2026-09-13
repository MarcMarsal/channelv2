// utils/time.js
// Descripció:
// Detecta canvi de dia UTC → compara date_utc guardada amb el timestamp actual → retorna true/false.
// Fitxer FIAT PUR, sense dependències.

/**
 * Retorna YYYY-MM-DD en UTC.
 */
export function toUtcDateString(timestamp) {
    return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Detecta si el timestamp actual pertany a un nou dia UTC
 * respecte la data guardada a l'estat VWAP.
 */
export function isNewUtcDay(stateDateUtc, timestamp) {
    const currentUtc = toUtcDateString(timestamp);
    return currentUtc !== stateDateUtc;
}
