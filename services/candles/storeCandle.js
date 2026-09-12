// fitxer storeCandle.js

import { client } from "../../db/client.js";

export async function storeCandle(table, symbol, timeframe, c) {

  const timestamp_es = new Date(
    new Date(c.timestamp).toLocaleString("en-US", { timeZone: "Europe/Madrid" })
  ).getTime();

  const date_es = new Date(c.timestamp).toLocaleString("es-ES", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", "");

  const created_at = Date.now();

  await client.query(`
    INSERT INTO ${table} (
      symbol, timeframe, timestamp,
      open, high, low, close, volume,
      timestamp_es, date_es, created_at, confirm
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (symbol, timeframe, timestamp)
    DO UPDATE SET
      open=$4, high=$5, low=$6, close=$7, volume=$8,
      timestamp_es=$9, date_es=$10,
      created_at=$11,
      confirm=$12;
  `, [
    symbol, timeframe, c.timestamp,
    c.open, c.high, c.low, c.close, c.volume,
    timestamp_es, date_es, created_at, c.confirm
  ]);
}
