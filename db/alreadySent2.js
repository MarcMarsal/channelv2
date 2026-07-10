// db/alreadySent2.js — FIAT‑PRO (evitar duplicats de senyals)

import { client } from "./client.js";

export async function alreadySent2(symbol, timeframe, timestamp) {
  const res = await client.query(
    `
    SELECT 1
    FROM signals_channels
    WHERE symbol = $1
      AND timeframe = $2
      AND timestamp = $3
    LIMIT 1
    `,
    [symbol, timeframe, timestamp]
  );

  return res.rowCount > 0;
}
