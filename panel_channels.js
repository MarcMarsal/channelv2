// panel_channels.js — FIAT + LonesomeTheBlue (sense OCR, amb motius i info Lonesome)

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";
import { DECIMALS, fmt } from "./core/decimals.js";
import { getActiveSignals, getChannels } from "./core/getChannelInfo.js";

// -------------------------------------------------------------
// TAULA DE CANALS FIAT 15m (sense OCR)
// -------------------------------------------------------------
function renderChannelsTable(channels) {
  let rows = "";

  for (const ch of channels) {

    let color = "yellow";
    if (ch.confirm) color = "lime";
    else if (ch.accio !== "") color = "cyan";

    rows += `
      <tr data-symbol="${ch.symbol}"
          data-accio="${ch.accio}"
          style="color:${color}">
        
        <td>${ch.symbol}</td>

        <td>${fmt(ch.upper, ch.symbol)}</td>
        <td>${fmt(ch.mid, ch.symbol)}</td>
        <td>${fmt(ch.lower, ch.symbol)}</td>

        <td>${fmt(ch.open, ch.symbol)}</td>
        <td>${fmt(ch.close, ch.symbol)}</td>

        <td>${ch.accio || "-"}</td>
        <td>${ch.confirm ? "sí" : "no"}</td>

        <td>${ch.data_es}</td>
        <td>${ch.hora_es}</td>
      </tr>
    `;
  }

  return `
    <h2>Canals FIAT 15m (últims 6 per cripto)</h2>

    <!-- FILTRE + SYMBOL -->
    <div style="margin-bottom:20px;">

      <label style="color:#0f0; font-size:18px;">
        Filtre:
        <select id="filterMode" style="font-size:16px; padding:4px;">
          <option value="all">Tots els canals</option>
          <option value="accio">Només canals amb acció</option>
          <option value="reingres">Només reingressos</option>
        </select>
      </label>

      <label style="color:#0f0; font-size:18px; margin-left:20px;">
        Symbol:
        <select id="symbolFilter" style="font-size:16px; padding:4px;">
          <option value="all">Tots</option>
          ${[...new Set(channels.map(c => c.symbol))]
            .map(sym => `<option value="${sym}">${sym}</option>`).join("")}
        </select>
      </label>

    </div>

    <script>
      const filterMode = localStorage.getItem("filterMode") || "all";
      const symbolFilter = localStorage.getItem("symbolFilter") || "all";

      document.getElementById("filterMode").value = filterMode;
      document.getElementById("symbolFilter").value = symbolFilter;

      document.getElementById("filterMode").addEventListener("change", e => {
        localStorage.setItem("filterMode", e.target.value);
        location.reload();
      });

      document.getElementById("symbolFilter").addEventListener("change", e => {
        localStorage.setItem("symbolFilter", e.target.value);
        location.reload();
      });

      window.addEventListener("DOMContentLoaded", () => {
        const mode = localStorage.getItem("filterMode") || "all";
        const sym = localStorage.getItem("symbolFilter") || "all";

        const rows = document.querySelectorAll("table tbody tr");

        rows.forEach(row => {
          const accio = row.dataset.accio;
          const symbol = row.dataset.symbol;

          let hide = false;

          if (mode === "reingres" && !accio.includes("reingres")) hide = true;
          if (mode === "accio" && accio === "") hide = true;
          if (sym !== "all" && symbol !== sym) hide = true;

          row.style.display = hide ? "none" : "";
        });
      });
    </script>

    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Upper</th>
          <th>Mid</th>
          <th>Lower</th>
          <th>Open</th>
          <th>Close</th>
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
// TAULA D'ALERTES LONESOME PUR (Entrada + TP/SL + motius)
// -------------------------------------------------------------
function renderActiveSignalsTable(signals) {
  let rows = "";

  for (const s of signals) {

    const color = s.entra ? "lime" : "orange";

    rows += `
      <tr style="color:${color}">
        <td>${s.id}</td>
        <td>${s.symbol}</td>
        <td>${s.type}</td>

        <!-- Entrada + TP/SL -->
        <td>${fmt(s.entry, s.symbol)} (${fmt(s.tp, s.symbol)} / ${fmt(s.sl, s.symbol)})</td>
        <td>${fmt(s.tp, s.symbol)}</td>
        <td>${fmt(s.sl, s.symbol)}</td>

        <!-- Resultat -->
        <td>${s.entra ? "ENTRA" : "NO ENTRA"}</td>
        <td>${s.motiu || "-"}</td>

        <!-- Institucional -->
        <td>${s.cas || "-"}</td>
        <td>${s.slope_dir || "-"}</td>
        <td>${s.noise ? "sí" : "no"}</td>
        <td>${s.alerta || "-"}</td>

        <!-- RR + Stage + Result -->
        <td>${s.rr ? fmt(s.rr, s.symbol) : "-"}</td>
        <td>${s.stage || "-"}</td>
        <td>${s.result || "-"}</td>

        <!-- Sortida -->
        <td>${s.price_exit ? fmt(s.price_exit, s.symbol) : "-"}</td>
        <td>${s.duration_ms || "-"}</td>

        <!-- Debug extra -->
        <td>${s.prev_accio || "-"}</td>

        <!-- Dates -->
        <td>${s.date_es}</td>
        <td>${s.hora_es}</td>
        <td>${formatSpainTime(s.created_at)}</td>

        <!-- Sortida FI -->
        <td>${s.date_exit_es || "-"}</td>
        <td>${s.hora_exit_es || "-"}</td>
      </tr>
    `;
  }

  return `
    <h2>Alertes LonesomeTheBlue 15m (FI complet)</h2>
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Symbol</th>
          <th>Tipus</th>

          <th>Entrada (TP/SL)</th>
          <th>TP</th>
          <th>SL</th>

          <th>Resultat</th>
          <th>Motiu</th>

          <th>CAS</th>
          <th>SlopeDir</th>
          <th>Soroll</th>
          <th>Alerta</th>

          <th>RR</th>
          <th>Stage</th>
          <th>Result</th>

          <th>Exit Price</th>
          <th>Duració (ms)</th>

          <th>Prev Acció</th>

          <th>Data</th>
          <th>Hora</th>
          <th>Creat</th>

          <th>Data Exit</th>
          <th>Hora Exit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
}

// -------------------------------------------------------------
// PANELL PRINCIPAL FIAT + LONESOME PUR
// -------------------------------------------------------------
async function startPanel() {
  await initDB();

  http.createServer(async (req, res) => {

    // ---------------------------------------------------------
    // PANELL HTML
    // ---------------------------------------------------------
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
        <h1>Panell LonesomeTheBlue 15m</h1>
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
    res.end("Panell LonesomeTheBlue 15m OK");
  }).listen(process.env.PORT || 3000);

  console.log("Panell LonesomeTheBlue 15m en marxa");
}

startPanel();
