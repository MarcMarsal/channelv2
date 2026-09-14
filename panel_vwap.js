// panel_vwap.js — FIAT PUR institucional
// Panell VWAP sense Express, igual que LonesomeTheBlue

import http from "http";
import { initDB, client } from "./db/client.js";
import { formatSpainTime } from "./core/utils.js";
import { DECIMALS, fmt } from "./core/decimals.js";

// -------------------------------------------------------------
// HTML helpers
// -------------------------------------------------------------
function renderStateTable(state) {
    if (!state) return "<p style='color:red'>No hi ha estat per avui</p>";

    return `
      <h2>Estat del dia (vwap_state)</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Data UTC</th>
            <th>sum_pv</th>
            <th>sum_v</th>
            <th>VWAP</th>
            <th>Sigma</th>
            <th>Candles</th>
            <th>Updated_at</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${state.symbol}</td>
            <td>${state.date_utc}</td>
            <td>${state.sum_pv}</td>
            <td>${state.sum_v}</td>
            <td>${state.vwap}</td>
            <td>${state.sigma}</td>
            <td>${state.candles_processed}</td>
            <td>${state.updated_at}</td>
          </tr>
        </tbody>
      </table>
    `;
}

function renderEntriesTable(entries) {
    let rows = "";

    for (const e of entries) {
        rows += `
          <tr>
            <td>${e.symbol}</td>
            <td>${e.timestamp}</td>
            <td>${e.entry_type}</td>
            <td>${e.entry_direction}</td>
            <td>${e.entry_price}</td>
          </tr>
        `;
    }

    return `
      <h2>Entrades FIAT PUR (vwap_debug)</h2>
      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Timestamp</th>
            <th>Tipus</th>
            <th>Direcció</th>
            <th>Preu</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
}

function renderDebugTable(rows) {
    let htmlRows = "";

    for (const r of rows) {
        htmlRows += `
          <tr>
            <td>${r.timestamp}</td>
            <td>${r.vwap}</td>
            <td>${r.sigma}</td>

            <td>${r.upper1}</td>
            <td>${r.lower1}</td>
            <td>${r.upper2}</td>
            <td>${r.lower2}</td>
            <td>${r.upper3}</td>
            <td>${r.lower3}</td>

            <td>${r.distance_absolute}</td>
            <td>${r.distance_sigma}</td>
            <td>${r.distance_percent}</td>

            <td>${r.volume_current}</td>
            <td>${r.volume_average}</td>
            <td>${r.volume_relative}</td>

            <td>${r.rev_valid}</td>
            <td>${r.bo_valid}</td>
            <td>${r.rt_valid}</td>

            <td>${r.entry_type || "-"}</td>
            <td>${r.entry_direction || "-"}</td>
            <td>${r.entry_price || "-"}</td>
          </tr>
        `;
    }

    return `
      <h2>Debug de les últimes veles (vwap_debug)</h2>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>VWAP</th>
            <th>Sigma</th>

            <th>U1</th><th>L1</th>
            <th>U2</th><th>L2</th>
            <th>U3</th><th>L3</th>

            <th>Dist Abs</th>
            <th>Dist σ</th>
            <th>Dist %</th>

            <th>Vol Actual</th>
            <th>Vol Mitjà</th>
            <th>Vol Relatiu</th>

            <th>REV</th>
            <th>BO</th>
            <th>RT</th>

            <th>Entrada</th>
            <th>Dir</th>
            <th>Preu</th>
          </tr>
        </thead>
        <tbody>${htmlRows}</tbody>
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
            const symbol = "BTC-USDT";

            // 🔥 Data UTC del dia actual
            const now = new Date();
            const dateUtc = now.toISOString().split("T")[0];

            // 🔥 Estat del dia
            const stateQuery = `
              SELECT *
              FROM vwap_state
              WHERE symbol = $1 AND date_utc = $2
              LIMIT 1
            `;
            const stateResult = await client.query(stateQuery, [symbol, dateUtc]);
            const state = stateResult.rows[0];

            // 🔥 Entrades FIAT PUR
            const entriesQuery = `
              SELECT symbol, timestamp, entry_type, entry_direction, entry_price
              FROM vwap_debug
              WHERE symbol = $1 AND entry_type IS NOT NULL
              ORDER BY timestamp DESC
              LIMIT 50
            `;
            const entriesResult = await client.query(entriesQuery, [symbol]);
            const entries = entriesResult.rows;

            // 🔥 Debug complet
            const debugQuery = `
              SELECT *
              FROM vwap_debug
              WHERE symbol = $1
              ORDER BY timestamp DESC
              LIMIT 200
            `;
            const debugResult = await client.query(debugQuery, [symbol]);
            const debugRows = debugResult.rows;

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
                <h1>Panell VWAP FIAT PUR — ${symbol}</h1>
                <p><b>Última actualització:</b> ${lastUpdate}</p>

                ${renderStateTable(state)}
                ${renderEntriesTable(entries)}
                ${renderDebugTable(debugRows)}

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
