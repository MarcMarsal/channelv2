// panel_channels.js — FIAT‑PRO CHANNEL PANEL

import http from "http";
import { client } from "./db/client.js";

async function getSignals() {
  const res = await client.query(`
    SELECT *
    FROM signals_channels
    ORDER BY timestamp DESC
    LIMIT 200
  `);
  return res.rows;
}

const server = http.createServer(async (req, res) => {
  const rows = await getSignals();

  let html = `
    <html>
    <head>
      <title>FIAT-PRO Channels</title>
      <meta http-equiv="refresh" content="60">
      <style>
        body { font-family: Arial; background: #111; color: #eee; }
        table { width: 100%; border-collapse: collapse; }
        td, th { padding: 6px; border-bottom: 1px solid #333; }
      </style>
    </head>
    <body>
      <h2>FIAT-PRO Channels</h2>
      <table>
        <tr>
          <th>Symbol</th>
          <th>TF</th>
          <th>Type</th>
          <th>Entry</th>
          <th>TP</th>
          <th>SL</th>
          <th>Slope</th>
          <th>Dev</th>
          <th>Mid</th>
          <th>Timestamp</th>
        </tr>
  `;

  for (const r of rows) {
    html += `
      <tr>
        <td>${r.symbol}</td>
        <td>${r.timeframe}</td>
        <td>${r.type}</td>
        <td>${r.entry.toFixed(4)}</td>
        <td>${r.tp.toFixed(4)}</td>
        <td>${r.sl.toFixed(4)}</td>
        <td>${r.slope.toFixed(6)}</td>
        <td>${r.dev.toFixed(6)}</td>
        <td>${r.mid.toFixed(4)}</td>
        <td>${new Date(r.timestamp).toLocaleString()}</td>
      </tr>
    `;
  }

  html += `
      </table>
    </body>
    </html>
  `;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

server.listen(8080, () => {
  console.log("Panell FIAT-PRO Channels en http://localhost:8080");
});
