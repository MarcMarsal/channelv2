// panel_channels.js — FIAT‑PRO (sense mode validació)

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";

function fmt(n) {
  return n !== null && n !== undefined ? Number(n).toFixed(4) : "-";
}

// -------------------------------------------------------------
// LLEGIR ÚLTIMES ALERTES FIAT‑PRO
// -------------------------------------------------------------
async function getActiveSignals() {
  const q = await client.query(`
    SELECT
      id,
      symbol,
      timeframe,
      type,
      entry,
      tp,
      sl,
      color,
      slope,
      dev,
      mid,
      timestamp_ms,
      date_es,
      hora_es,
      created_at
    FROM signals_channels
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return q.rows;
}

// -------------------------------------------------------------
// LLEGIR ÚLTIMS CANALS FIAT‑PRO (un per symbol)
// -------------------------------------------------------------
async function getChannels() {
  const q = await client.query(`
    SELECT DISTINCT ON (symbol)
      symbol,
      timeframe,
      slope,
      intercept,
      endy,
      dev,
      devlen,
      mid,
      len,
      upper,
      lower,
      k,
      operable,
      reason,
      timestamp
    FROM channels_fiat
    ORDER BY symbol, timestamp DESC
  `);

  return q.rows;
}

// -------------------------------------------------------------
// TAULA DE CANALS FIAT‑PRO
// -------------------------------------------------------------
function renderChannelsTable(channels) {
  let rows = "";

  for (const ch of channels) {
    const color = ch.operable ? "lime" : "red";

    rows += `
      <tr style="color:${color}">
        <td>${ch.symbol}</td>
        <td>${fmt(ch.upper)}</td>
        <td>${fmt(ch.mid)}</td>
        <td>${fmt(ch.lower)}</td>
        <td>${fmt(ch.k)}</td>
        <td>${fmt(ch.slope)}</td>
        <td>${fmt(ch.dev)}</td>
        <td>${fmt(ch.devlen)}</td>
        <td>${fmt(ch.len)}</td>
        <td>${ch.operable ? "OPERABLE" : "NO"}</td>
        <td>${ch.reason || "-"}</td>
      </tr>
    `;
  }

  return `
    <h2>Canals FIAT‑PRO (últim per cada cripto)</h2>

    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Upper</th>
          <th>Mid</th>
          <th>Lower</th>
          <th>K</th>
          <th>Slope</th>
          <th>Dev</th>
          <th>DevLen</th>
          <th>Len</th>
          <th>Operable</th>
          <th>Reason</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// TAULA D'ALERTES FIAT‑PRO
// -------------------------------------------------------------
function renderActiveSignalsTable(signals) {
  let rows = "";

  for (const s of signals) {
    let color = s.color || "#00ff00";
    if (color.toLowerCase() === "blue") color = "cyan";

    rows += `
      <tr style="color: ${color}">
        <td>${s.id}</td>
        <td>${s.symbol}</td>
        <td>${s.timeframe}</td>
        <td>${s.type}</td>
        <td>${fmt(s.entry)}</td>
        <td>${fmt(s.tp)}</td>
        <td>${fmt(s.sl)}</td>
        <td>${fmt(s.slope)}</td>
        <td>${fmt(s.dev)}</td>
        <td>${fmt(s.mid)}</td>
        <td>${s.date_es}</td>
        <td>${s.hora_es}</td>
        <td>${formatSpainTime(s.created_at)}</td>
      </tr>
    `;
  }

  return `
    <h2>Últimes 20 alertes FIAT‑PRO Channels</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Symbol</th>
          <th>TF</th>
          <th>Tipus</th>
          <th>Entrada</th>
          <th>TP</th>
          <th>SL</th>
          <th>Slope</th>
          <th>Dev</th>
          <th>Mid</th>
          <th>Data</th>
          <th>Hora</th>
          <th>Creat</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// PANELL PRINCIPAL
// -------------------------------------------------------------
async function startPanel() {
  await initDB();

  http.createServer(async (req, res) => {
    if (req.url === "/") {
      const signals = await getActiveSignals();
      const channels = await getChannels();

      const signalsHTML = renderActiveSignalsTable(signals);
      const channelsHTML = renderChannelsTable(channels);

      const lastUpdate = formatSpainTime(Date.now());

      const html = `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="60">
        <style>
          body {
            background-color: #000;
            color: #00ff00;
            font-family: Consolas, monospace;
            padding: 20px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 40px;
          }
          th, td {
            border: 1px solid #00ff00;
            padding: 6px;
            text-align: center;
          }
          th {
            background-color: #003300;
          }
        </style>
      </head>
      <body>
        <h1>Panell FIAT‑PRO Channels</h1>
        <p><b>Última actualització:</b> ${lastUpdate}</p>

        ${channelsHTML}
        ${signalsHTML}

      </body>
      </html>
      `;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    res.writeHead(200);
    res.end("Panell FIAT‑PRO Channels OK");
  }).listen(process.env.PORT || 3000);

  console.log("Panell FIAT‑PRO Channels en marxa");
}

startPanel();
