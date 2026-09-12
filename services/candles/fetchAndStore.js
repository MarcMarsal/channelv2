// fetchAndStore.js

import { fetchCryptoOKX } from "./fetchCryptoOKX.js";
import { storeCandle } from "./storeCandle.js";

export async function fetchAndStoreCandles(symbol, timeframe = "15m") {
  try {
    const candles = await fetchCryptoOKX(symbol, timeframe);

    for (const c of candles) {
      await storeCandle("candles", symbol, timeframe, c);
    }

  } catch (err) {
    console.log("❌ Error descarregant veles:", symbol, timeframe, err.message);
  }
}
