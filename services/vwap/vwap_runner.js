// services/vwap/vwap_runner.js
// Flux institucional FIAT PUR:
// - Carrega estat del dia actual
// - Llegeix l’última vela tancada (confirm = true)
// - Si el timestamp ha canviat → processa la vela
// - Guarda estat
// - Si no ha canviat → no fa res

import { getLastClosedCandle } from '../../db/candles_repository.js';
import { loadState, persistState } from './vwap_state.js';
import { processCandle } from './vwap_processor.js';

export async function runVWAPForSymbol(symbol) {
    try {
        console.log(`[VWAP RUNNER] Iniciant per ${symbol}`);

        // 🔥 FIAT PUR: data UTC del dia actual (YYYY-MM-DD)
        const now = new Date();
        const dateUtc = now.toISOString().split("T")[0];

        // 🔥 Carregar estat del dia
        let state = await loadState(symbol, dateUtc);

        // 🔥 Obtenir l’última vela tancada
        const lastClosedCandle = await getLastClosedCandle(symbol);

        if (!lastClosedCandle) {
            console.log("[VWAP RUNNER] No hi ha cap vela tancada");
            return;
        }

        console.log("[VWAP RUNNER] Última vela tancada:", lastClosedCandle.timestamp);

        // 🔥 FIAT PUR: només processar si el timestamp ha canviat
        if (state.updated_at === lastClosedCandle.timestamp) {
            console.log("[VWAP RUNNER] No hi ha nova vela tancada");
            return;
        }

        // 🔥 Processar la nova vela tancada
        const { newState, vwap, sigma } = processCandle(state, lastClosedCandle);

        // 🔥 Guardar estat actualitzat
        await persistState(symbol, newState, vwap, sigma);

        console.log("[VWAP RUNNER] Vela processada:", lastClosedCandle.timestamp);
        console.log("[VWAP RUNNER] VWAP:", vwap, "Sigma:", sigma);

    } catch (err) {
        console.error("[VWAP RUNNER ERROR]", err);
    }
}
