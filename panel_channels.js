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
// LLEGIR ÚLTIMS CANALS FIAT 15m (últims 6 per symbol)
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
        operable,
        reason,
        timestamp,
        data_es,
        hora_es,
        ROW_NUMBER() OVER (PARTITION BY symbol ORDER BY timestamp DESC) AS rn
      FROM channels_fiat
    ) t
    WHERE rn <= 6
    ORDER BY symbol, timestamp DESC
  `);

  return q.rows;
}

// -------------------------------------------------------------
// TAULA DE CANALS FIAT 15m
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
    <h2>Canals FIAT 15m (últims 6 per cripto)</h2>

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

    <br><br>

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
// TAULA D'ALERTES FIAT 15m (Entrada + TP/SL)
// -------------------------------------------------------------
function renderActiveSignalsTable(signals) {
  let rows = "";

  for (const s of signals) {
    rows += `
      <tr style="color:cyan">
        <td>${s.id}</td>
        <td>${s.symbol}</td>
        <td>${s.type}</td>

        <!-- Entrada + TP + SL -->
        <td>${fmt(s.entry)} (${fmt(s.tp)} / ${fmt(s.sl)})</td>

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
          <th>Entrada (TP/SL)</th>
          <th>TP</th>
          <th>SL</th>
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

    // ---------------------------------------------------------
    // API: CARREGAR OCR → ACTUALITZAR ÚLTIM CANAL
    // ---------------------------------------------------------
    if (req.url === "/api/load-ocr" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", async () => {
        const data = JSON.parse(body);

        const q = await client.query(`
          SELECT id FROM channels_fiat
          WHERE symbol = $1
          ORDER BY timestamp DESC
          LIMIT 1
        `, [data.symbol]);

        if (q.rows.length === 0) {
          res.writeHead(404);
          return res.end("No canal found");
        }

        const id = q.rows[0].id;

        await client.query(`
          UPDATE channels_fiat
          SET upper = $1, mid = $2, lower = $3
          WHERE id = $4
        `, [data.upper, data.mid, data.lower, id]);

        res.writeHead(200);
        res.end("OK");
      });
      return;
    }

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
        <h1>Panell FIAT 15m — LonesomeTheBlue</h1>
        <p><b>Última actualització:</b> ${lastUpdate}</p>

        ${channelsHTML}
        ${signalsHTML}

        <hr>
        <h2>Carregar canal via OCR</h2>

        <input id="ocrInput"
               placeholder="SEIUSDT | 0.0492166011 | 0.0486748989 | 0.0481331967"
               style="width:500px; padding:6px; font-size:16px;">

        <button id="ocrLoadBtn"
                style="padding:6px 12px; font-size:16px; margin-left:10px;">
          Carrega
        </button>

        <script>
          function parseOCR(raw) {
            const parts = raw.split("|").map(p => p.trim());
            let symbol = parts[0].replace("USDT", "-USDT");

            return {
              symbol,
              upper: parseFloat(parts[1]),
              mid: parseFloat(parts[2]),
              lower: parseFloat(parts[3])
            };
          }

          async function loadOCRToChannel() {
            const raw = document.getElementById("ocrInput").value.trim();
            if (!raw) return alert("Introdueix el text OCR");

            const data = parseOCR(raw);

            await fetch("/api/load-ocr", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data)
            });

            alert("Canal actualitzat!");
            location.reload();
          }

          document.getElementById("ocrLoadBtn").onclick = loadOCRToChannel;
        </script>

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
