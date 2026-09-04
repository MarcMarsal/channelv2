import express from "express";
import { initDB, client } from "./db/client.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";

const app = express();

// 1) Servir la carpeta public/
app.use(express.static("public"));

/**
 * /chart-data
 * Retorna:
 *  - candles (OHLC)
 *  - upper/mid/lower del canal FIAT calculat amb el mateix codi del bot
 *
 * IMPORTANT:
 *  Lightweight Charts requereix timestamps en segons, no en ms.
 */
app.get("/chart-data", async (req, res) => {
    try {
        // Permetre canviar symbol via URL:
        // http://localhost:3001/chart-data?symbol=BTC-USDT
        const symbol = req.query.symbol || "BTC-USDT";
        const timeframe = "15m";

        // 1) Agafar candles de la DB (igual que el bot)
        const candlesRes = await client.query(`
            SELECT *
            FROM candles
            WHERE symbol = $1 AND timeframe = $2
            ORDER BY timestamp ASC
            LIMIT 200
        `, [symbol, timeframe]);

        const candles = candlesRes.rows.map(c => ({
            time: Math.floor(c.timestamp / 1000), // Lightweight Charts → segons
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close
        }));

        // Si no hi ha candles, retornem buit
        if (candles.length === 0) {
            return res.json({ candles: [], upper: [], mid: [], lower: [] });
        }

        // 2) Calcular el canal FIAT amb el mateix codi del bot
        const channel = calculateChannelFIAT(candles);

        // 3) Convertir upper/mid/lower a format Lightweight Charts
        const upper = candles.map(c => ({
            time: c.time,
            value: channel.upper
        }));

        const mid = candles.map(c => ({
            time: c.time,
            value: channel.mid
        }));

        const lower = candles.map(c => ({
            time: c.time,
            value: channel.lower
        }));

        // 4) Enviar dades al visor
        res.json({ candles, upper, mid, lower });

    } catch (err) {
        console.error("❌ Error /chart-data:", err);
        res.json({ candles: [], upper: [], mid: [], lower: [] });
    }
});

// 5) Iniciar servidor
async function startViewer() {
    await initDB();
    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () =>
        console.log(`📈 Viewer FIAT en marxa → http://localhost:${PORT}`)
    );
}

startViewer();
