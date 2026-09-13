// services/vwap/vwap_service.js
// Descripció:
// Rep una vela → actualitza estat → calcula VWAP → calcula bandes → calcula condicions → detecta entrada → guarda debug.

import { loadState, resetIfNewDay, updateState } from './vwap_state.js';
import { typicalPrice, vwap, sigma, distances, volumeRelative } from './vwap_math.js';
import { computeBands } from './vwap_bands.js';
import { evaluateConditions } from './vwap_conditions.js';
import { detectEntry } from './vwap_entries.js';
import { buildDebugRow } from './vwap_debug.js';

import { saveState } from '../../db/vwap_state_repository.js';
import { insertDebug } from '../../db/vwap_debug_repository.js';

export async function processCandle(candle) {
    const { symbol, open, high, low, close, volume, timestamp } = candle;

    // 1) Carregar estat del dia
    let state = await loadState(symbol, timestamp);

    // 2) Reiniciar si és un nou dia
    state = resetIfNewDay(state, timestamp);

    // 3) TP (Typical Price)
    const tp = typicalPrice(open, high, low, close);

    // 4) Actualitzar sumPV i sumV
    state = updateState(state, tp, volume);

    // 5) Calcular VWAP i sigma
    const vwapValue = vwap(state.sum_pv, state.sum_v);
    const sigmaValue = sigma(state, tp);

    // 6) Bandes
    const bands = computeBands(vwapValue, sigmaValue);

    // 7) Distàncies
    const dist = distances(tp, vwapValue, sigmaValue);

    // 8) Volum relatiu
    const volInfo = volumeRelative(volume, state);

    // 9) Condicions institucionals
    const conditions = evaluateConditions({
        tp,
        vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo: volInfo,
        candle
    });

    // 10) Entrada final
    const entry = detectEntry(conditions, tp, timestamp);

    // 11) Guardar estat
    await saveState(symbol, state, vwapValue, sigmaValue);

    // 12) Guardar debug
    const debugRow = buildDebugRow({
        symbol,
        timestamp,
        vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo: volInfo,
        conditions,
        entry
    });

    await insertDebug(debugRow);

    return {
        state,
        vwap: vwapValue,
        sigma: sigmaValue,
        bands,
        distances: dist,
        volumeInfo: volInfo,
        conditions,
        entry
    };
}
