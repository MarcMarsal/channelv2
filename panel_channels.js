// panel_channels.js — FIAT‑PRO (amb mode validació ON/OFF)

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";

const VALIDATION_MODE = process.env.CHANNEL_VALIDATION_MODE === "true";

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
// LLEGIR CANALS GUARDATS (per mode validació)
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
      timestamp
    FROM channels_fiat
    ORDER BY symbol, timestamp DESC
  `);

  return q.rows;
}


// -------------------------------------------------------------
// TAULA DE VALIDACIÓ (6 punts per dibuixar rectes)
// -------------------------------------------------------------
function renderChannelValidationTable(channels) {
  let rows = "";

  for (const ch of channels) {
    const upper = ch.endy + ch.dev * ch.devlen;
    const mid   = ch.endy;
    const lower = ch.endy - ch.dev * ch.devlen;

    rows += `
      <tr>
        <td>${ch.symbol}</td>
        <td>${fmt(upper)}</td>
        <td>${fmt(mid)}</td>
        <td>${fmt(lower)}</td>
      </tr>
    `;
  }

  return `
    <h2>Mode Validació (última vela tancada)</h2>
    <p>Dibuixa 3 línies horitzontals a TradingView a la última vela tancada:</p>
    <ul>
      <li>Upper</li>
      <li>Mid</li>
      <li>Lower</li>
    </ul>

    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Upper</th>
          <th>Mid</th>
          <th>Lower</th>
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
      const signalsHTML = renderActiveSignalsTable(signals);

      let validationHTML = "";
      if (VALIDATION_MODE) {
        const channels = await getChannels();
        validationHTML = renderChannelValidationTable(channels);
      }

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

        ${VALIDATION_MODE ? validationHTML : ""}
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
