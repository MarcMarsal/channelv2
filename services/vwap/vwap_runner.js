// services/vwap/vwap_runner.js
// Descripció:
// Llegeix veles → processa cada vela amb vwap_service → actualitza estat → guarda debug → registra logs.
// És el cron job que manté el sistema VWAP en funcionament.

import { processCandle } from './vwap_service.js';
import { getCandlesSince } from '../../db/candles_repository.js';
import { loadState } from './vwap_state.js';   // <-- IMPORTANT
import { logInfo, logError } from '../../utils/logger.js';

/**
 * Executa el procés VWAP per un símbol concret.
 */
export async function runVWAPForSymbol(symbol, sinceTimestamp) {
    try {
        logInfo(`VWAP RUNNER → Iniciant processament per ${symbol}`);

        // 🟩 FIAT PUR: Determinar SINCE
        let since = sinceTimestamp;

        if (since === null) {
            // Carreguem estat del dia actual
            const state = await loadState(symbol, Date.now());

            if (state) {
                // Processar només veles noves
                since = state.updated_at;
                console.log(`[VWAP SINCE] Usant updated_at = ${new Date(since).toISOString()}`);
            } else {
                // Primer dia → només últimes 24h
                since = Date.now() - 24 * 60 * 60 * 1000;
                console.log(`[VWAP SINCE] No hi ha estat → últimes 24h`);
            }
        }

        // 1) Obtenir veles noves
        const candles = await getCandlesSince(symbol, since);

        if (!candles.length) {
            logInfo(`VWAP RUNNER → No hi ha veles noves per ${symbol}`);
            return;
        }

        // 2) Processar cada vela
        for (const candle of candles) {
            console.log("[VWAP CANDLE RAW]", {
                symbol: candle.symbol,
                timestamp: candle.timestamp,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
                volume: candle.volume
            });

            if (candle.timestamp === undefined || Number.isNaN(candle.timestamp)) {
                console.error("[VWAP ERROR] Candle timestamp is INVALID:", candle);
            }

            await processCandle(candle);
        }

        logInfo(`VWAP RUNNER → Processament complet per ${symbol} (${candles.length} veles)`);

    } catch (err) {
        logError(`VWAP RUNNER ERROR → ${err.message}`);
    }
}

/**
 * Executa el procés VWAP per múltiples símbols.
 */
export async function runVWAPForSymbols(symbols, sinceTimestamp) {
    for (const symbol of symbols) {
        await runVWAPForSymbol(symbol, sinceTimestamp);
    }
}

