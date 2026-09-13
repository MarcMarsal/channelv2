
import cron from "node-cron";
import { runVWAPForSymbol } from './services/vwap/vwap_runner.js';

const SINCE = Date.now();

const ACTIVE_CRYPTOS = [
  // Bones
  "BTC-USDT","ETH-USDT","BNB-USDT","SOL-USDT","AVAX-USDT","INJ-USDT",

  // Mitjanes
  "NEAR-USDT","APT-USDT","SUI-USDT","SEI-USDT","LINK-USDT","ATOM-USDT","ARB-USDT","OP-USDT"
];


async function mainLoop() {
  for (const symbol of ACTIVE_CRYPTOS) {
    console.log(`[VWAP START] Processant ${symbol} des de ${new Date(SINCE).toISOString()}`);
    await runVWAPForSymbol(symbol, SINCE);
  }
}

async function startBot() {
  console.log("Bot VWAP en marxa");
  cron.schedule("* * * * *", mainLoop);   // FIAT PUR
}

startBot();

