// panel_channels.js — FIAT 15m (punxada + entrada + TP/SL/RR)

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";

function fmt(n) {
  return n !== null && n !== undefined ? Number(n).toFixed(4) : "-";
}

// -------------------------------------------------------------
// LLEGIR ÚLTIMES ALERTES FIAT 15m
// -------------------------------------------------------------
async function getActiveSignals() {
  const q = await client.query(`
    SELECT
      id,
      symbol,
      type,
      entry,
      tp,
      sl,
      timestamp,
      date_es,
      hora_es,
      created_at
    FROM signals_channels
    ORDER BY created_at DESC
    LIMIT 30
  `);

  return q.rows;
}

// -------------------------------------------------------------
// LLEGIR ÚLTIMS CANALS FIAT 15m (últims 3 per symbol)
// -------------------------------------------------------------
async function getChannels() {
  const q = await client.query(`
    SELECT *
    FROM (
      SELECT
        symbol,
        open,
        close,
        upper,
        mid,
        lower,
        accio,
        confirm,
        timestamp,
        data_es,
        hora_es,
        ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) AS rn
      FROM channels_fiat
    ) t
    WHERE rn <= 3
    ORDER BY symbol, timestamp DESC
  `);

  return q.rows;
}

// -------------------------------------------------------------
// TAULA DE CANALS FIAT 15m
// -------------------------------------------------------------
function renderChannelsTable(channels) {
  let rows = "";

  // FILTRE FIAT (localStorage)
  const filterMode = `
    <script>
      document.write(localStorage.getItem("filterMode") || "all");
    </script>
  `;

  for (const ch of channels) {

    // Aplicar filtre
    if (filterMode.includes("open") && ch.confirm === true) {
      continue; // només mostrar canals oberts
    }

    // Colors FIAT
    let color = "yellow"; // canal obert sense acció
    if (ch.confirm) color = "lime"; // canal confirmat
    else if (ch.accio !== "") color = "cyan"; // acció provisional

    rows += `
      <tr style="color:${color}">
        <td>${ch.symbol}</td>

        <td>${fmt(ch.upper)}</td>
        <td>${fmt(ch.mid)}</td>
        <td>${fmt(ch.lower)}</td>

        <td>${fmt(ch.open)}</td>
        <td>${fmt(ch.close)}</td>

        <td>${ch.accio || "-"}</td>
        <td>${ch.confirm ? "sí" : "no"}</td>

        <td>${ch.data_es}</td>
        <td>${ch.hora_es}</td>
      </tr>
    `;
  }

  return `
    <h2>Canals FIAT 15m (últims 3 per cripto)</h2>

    <label style="color:#0f0; font-size:18px;">
      Mostrar:
      <select id="filterMode" style="font-size:16px; padding:4px;">
        <option value="all">Tots els canals</option>
        <option value="open">Només canals oberts</option>
      </select>
    </label>

    <script>
      // Carregar filtre guardat
      const saved = localStorage.getItem("filterMode") || "all";
      document.getElementById("filterMode").value = saved;

      // Guardar quan l’usuari el canvia
      document.getElementById("filterMode").addEventListener("change", (e) => {
        localStorage.setItem("filterMode", e.target.value);
        location.reload(); // refrescar per aplicar el filtre
      });
    </script>

    <br><br>

    <table>
      <thead>
        <tr>
          <th>Symbol</th>

          <th>Upper</th>
          <th>Mid</th>
          <th>Lower</th>

          <th>Preu inicial</th>
          <th>Preu final</th>

          <th>Acció</th>
          <th>Confirm</th>

          <th>Data</th>
          <th>Hora</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// TAULA D'ALERTES FIAT 15m
// -------------------------------------------------------------
function renderActiveSignalsTable(signals) {
  let rows = "";

  for (const s of signals) {
    rows += `
      <tr style="color:cyan">
        <td>${s.id}</td>
        <td>${s.symbol}</td>
        <td>${s.type}</td>
        <td>${fmt(s.entry)}</td>
        <td>${fmt(s.tp)}</td>
        <td>${fmt(s.sl)}</td>
        <td>${s.date_es}</td>
        <td>${s.hora_es}</td>
        <td>${formatSpainTime(s.created_at)}</td>
      </tr>
    `;
  }

  return `
    <h2>Últimes 30 alertes FIAT 15m (breakout / reingrés)</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Symbol</th>
          <th>Acció</th>
          <th>Entrada</th>
          <th>Upper</th>
          <th>Lower</th>
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
// PANELL PRINCIPAL FIAT 15m
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
        <h1>Panell FIAT 15m — LonesomeTheBlue</h1>
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
    res.end("Panell FIAT 15m OK");
  }).listen(process.env.PORT || 3000);

  console.log("Panell FIAT 15m en marxa");
}

startPanel();
