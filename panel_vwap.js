// panel_vwap.js — FIAT PUR VWAP + Entrades + Històric

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";
import { fmt } from "./core/decimals.js";

// -------------------------------------------------------------
// TAULA: Estat del dia (vwap_state)
// -------------------------------------------------------------
function renderVWAPStateTable(rows) {
  let htmlRows = "";

  for (const r of rows) {
    htmlRows += `
      <tr>
        <td>${r.symbol}</td>
        <td>${r.date_utc}</td>
        <td>${r.candles_processed}</td>
        <td>${fmt(r.vwap)}</td>
        <td>${fmt(r.sigma)}</td>
        <td>${fmt(r.sum_pv)}</td>
        <td>${fmt(r.sum_v)}</td>
        <td>${formatSpainTime(r.updated_at)}</td>
      </tr>
    `;
  }

  return `
    <h2>VWAP FIAT PUR — Estat del dia</h2>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Dia UTC</th>
          <th>Veles</th>
          <th>VWAP</th>
          <th>Sigma</th>
          <th>sumPV</th>
          <th>sumV</th>
          <th>Actualitzat</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// TAULA: Debug per vela (vwap_debug)
// -------------------------------------------------------------
function renderVWAPDebugTable(rows) {
  let htmlRows = "";

  for (const r of rows) {

    let color = "yellow";
    if (r.entry_type) color = "lime";
    else if (r.bo_valid || r.rev_valid || r.rt_valid) color = "cyan";

    htmlRows += `
      <tr style="color:${color}">
        <td>${r.symbol}</td>
        <td>${formatSpainTime(r.timestamp)}</td>

        <td>${fmt(r.tp)}</td>
        <td>${fmt(r.vwap)}</td>
        <td>${fmt(r.sigma)}</td>

        <td>${fmt(r.band_upper_1s)}</td>
        <td>${fmt(r.band_lower_1s)}</td>

        <td>${fmt(r.dist_tp_vwap)}</td>
        <td>${fmt(r.vol_rel)}</td>

        <td>${r.bo_valid}</td>
        <td>${r.rev_valid}</td>
        <td>${r.rt_valid}</td>

        <td>${r.entry_type || "-"}</td>
        <td>${r.entry_direction || "-"}</td>
        <td>${fmt(r.entry_price)}</td>
      </tr>
    `;
  }

  return `
    <h2>VWAP FIAT PUR — Debug (últimes 2–3 hores)</h2>

    <!-- FILTRE + SYMBOL -->
    <div style="margin-bottom:20px;">

      <label style="color:#0f0; font-size:18px;">
        Filtre acció:
        <select id="filterMode" style="font-size:16px; padding:4px;">
          <option value="all">Totes</option>
          <option value="bo">Breakouts</option>
          <option value="rev">Reingressos</option>
          <option value="rt">Retests</option>
          <option value="entry">Entrades</option>
        </select>
      </label>

      <label style="color:#0f0; font-size:18px; margin-left:20px;">
        Symbol:
        <select id="symbolFilter" style="font-size:16px; padding:4px;">
          <option value="all">Tots</option>
          ${[...new Set(rows.map(r => r.symbol))]
            .map(sym => `<option value="${sym}">${sym}</option>`).join("")}
        </select>
      </label>

    </div>

    <script>
      const filterMode = localStorage.getItem("vwap_filterMode") || "all";
      const symbolFilter = localStorage.getItem("vwap_symbolFilter") || "all";

      document.getElementById("filterMode").value = filterMode;
      document.getElementById("symbolFilter").value = symbolFilter;

      document.getElementById("filterMode").addEventListener("change", e => {
        localStorage.setItem("vwap_filterMode", e.target.value);
        location.reload();
      });

      document.getElementById("symbolFilter").addEventListener("change", e => {
        localStorage.setItem("vwap_symbolFilter", e.target.value);
        location.reload();
      });

      window.addEventListener("DOMContentLoaded", () => {
        const mode = localStorage.getItem("vwap_filterMode") || "all";
        const sym = localStorage.getItem("vwap_symbolFilter") || "all";

        const rows = document.querySelectorAll("#vwapDebugTable tbody tr");

        rows.forEach(row => {
          const symbol = row.children[0].innerText;
          const bo = row.children[9].innerText === "true";
          const rev = row.children[10].innerText === "true";
          const rt = row.children[11].innerText === "true";
          const entry = row.children[12].innerText !== "-";

          let hide = false;

          if (mode === "bo" && !bo) hide = true;
          if (mode === "rev" && !rev) hide = true;
          if (mode === "rt" && !rt) hide = true;
          if (mode === "entry" && !entry) hide = true;
          if (sym !== "all" && symbol !== sym) hide = true;

          row.style.display = hide ? "none" : "";
        });
      });
    </script>

    <table id="vwapDebugTable">
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Hora</th>

          <th>TP</th>
          <th>VWAP</th>
          <th>Sigma</th>

          <th>+1σ</th>
          <th>-1σ</th>

          <th>Distància</th>
          <th>Vol Rel</th>

          <th>BO</th>
          <th>REV</th>
          <th>RT</th>

          <th>Entrada</th>
          <th>Dir</th>
          <th>Preu</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// TAULA: Entrades FIAT PUR (vwap_entries)
// -------------------------------------------------------------
function renderVWAPEntriesTable(rows) {
  let htmlRows = "";

  for (const e of rows) {
    htmlRows += `
      <tr style="color:lime">
        <td>${e.symbol}</td>
        <td>${formatSpainTime(e.timestamp)}</td>
        <td>${e.entry_type}</td>
        <td>${e.entry_direction}</td>
        <td>${fmt(e.entry_price)}</td>
      </tr>
    `;
  }

  return `
    <h2>Entrades FIAT PUR (últimes hores)</h2>
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Hora</th>
          <th>Tipus</th>
          <th>Direcció</th>
          <th>Preu</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// PANELL PRINCIPAL VWAP FIAT PUR
// -------------------------------------------------------------
async function startPanelVWAP() {
  await initDB();

  http.createServer(async (req, res) => {

    if (req.url === "/") {

      const stateRows   = await client.query("SELECT * FROM vwap_state ORDER BY symbol");
      const debugRows   = await client.query("SELECT * FROM vwap_debug ORDER BY timestamp DESC LIMIT 200");
      const entriesRows = await client.query("SELECT * FROM vwap_entries ORDER BY timestamp DESC LIMIT 50");

      const stateHTML   = renderVWAPStateTable(stateRows.rows);
      const debugHTML   = renderVWAPDebugTable(debugRows.rows);
      const entriesHTML = renderVWAPEntriesTable(entriesRows.rows);

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
        <h1>Panell VWAP FIAT PUR</h1>
        <p><b>Última actualització:</b> ${lastUpdate}</p>

        ${stateHTML}
        ${debugHTML}
        ${entriesHTML}

      </body>
      </html>
      `;

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }

    res.writeHead(200);
    res.end("Panell VWAP FIAT PUR OK");
  }).listen(process.env.PORT || 3000);

  console.log("Panell VWAP FIAT PUR en marxa");
}

startPanelVWAP();
