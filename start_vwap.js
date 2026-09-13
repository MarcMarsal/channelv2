// start_vwap.js
// Arrenca el servei VWAP per totes les criptos actives
// Processa només veles des del moment d'arrencada


import { runVWAPForSymbol } from './services/vwap/vwap_runner.js';

const SINCE = Date.now(); // només veles noves

const ACTIVE_CRYPTOS = [
  // Bones
  "BTC-USDT",
  "ETH-USDT",
  "BNB-USDT",
  "SOL-USDT",
  "AVAX-USDT",
  "INJ-USDT",

  // Mitjanes
  "NEAR-USDT",
  "APT-USDT",
  "SUI-USDT",
  "SEI-USDT",
  "LINK-USDT",
  "ATOM-USDT",
  "ARB-USDT",
  "OP-USDT"
];

(async () => {
    for (const symbol of ACTIVE_CRYPTOS) {
        console.log(`[VWAP START] Processant ${symbol} des de ${new Date(SINCE).toISOString()}`);
        await runVWAPForSymbol(symbol, SINCE);
    }
})();
