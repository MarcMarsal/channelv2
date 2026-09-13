//import cron from "node-cron";
//import { runVWAPForSymbol } from './services/vwap/vwap_runner.js';

// FIAT PUR: SINCE = null → el runner decidirà SINCE
//const SINCE = null;

//const ACTIVE_CRYPTOS = [
//  "BTC-USDT"
//];

//async function mainLoop() {
//  for (const symbol of ACTIVE_CRYPTOS) {
//    console.log(`[VWAP START] Processant ${symbol}`);
//    await runVWAPForSymbol(symbol, SINCE);
//  }
//}

//async function startBot() {
//  console.log("Bot VWAP en marxa");
//  cron.schedule("* * * * *", mainLoop);   // FIAT PUR
//}

//startBot();

import { runVWAPForSymbol } from './services/vwap/vwap_runner.js';

async function debugOnce() {
    console.log("Bot VWAP DEBUG (una sola execució)");

    await runVWAPForSymbol("BTC-USDT", null);

    console.log("Fi del debug");
    process.exit(0);
}

debugOnce();
