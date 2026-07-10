// db/client.js — FIAT‑PRO

import pg from "pg";
const { Client } = pg;

export const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function initDB() {
  await client.connect();
}
