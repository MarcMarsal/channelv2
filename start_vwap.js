// start_vwap.js
// Arrenca el bot VWAP FIAT PUR amb el nou flux institucional.
// Opcions:
//   - DEBUG: una sola execució
//   - PRODUCCIÓ: execució cada minut amb cron

import cron from "node-cron";
import { runVWAPForSymbol } from './services/vwap/vwap_runner.js';

// 🔥 Llista de símbols a processar
const ACTIVE_CRYPTOS = [
    "BTC-USDT"
];

// 🔥 Mode producció: processar cada minut
async function mainLoop() {
    for (const symbol of ACTIVE_CRYPTOS) {
        console.log(`[VWAP START] Processant ${symbol}`);
        await runVWAPForSymbol(symbol);
    }
}

// 🔥 Mode producció
async function startBot() {
    console.log("Bot VWAP en marxa (FIAT PUR)");
    cron.schedule("* * * * *", mainLoop);   // cada minut
}

// 🔥 Mode debug: una sola execució
async function debugOnce() {
    console.log("Bot VWAP DEBUG (una sola execució)");
    await runVWAPForSymbol("BTC-USDT");
    console.log("Fi del debug");
    process.exit(0);
}

// 🔥 Tria aquí el mode que vols
//startBot();
debugOnce();

