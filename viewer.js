import express from "express";
import { initDB, client } from "./db/client.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";

const app = express();

// Servir la carpeta public/
app.use(express.static("public"));

// Endpoint /chart-data
app.get("/chart-data", async (req, res) => {
    try {
        const symbol = req.query.symbol || "BTC-USDT";
        const timeframe = "15m";

        // 1) Agafar candles de la DB
        const candlesRes = await client.query(`
            SELECT *
            FROM candles
            WHERE symbol = $1 AND timeframe = $2
            ORDER BY timestamp ASC
            LIMIT 200
        `, [symbol, timeframe]);

        // 2) Convertir candles a format Lightweight Charts
        const candles = candlesRes.rows.map(c => ({
            time: Number(c.timestamp),   // 🔥 IMPORTANT: ha de ser número
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        }));

        if (candles.length === 0) {
            return res.json({ candles: [], upper: [], mid: [], lower: [] });
        }

        // 3) Calcular canal FIAT amb el mateix codi del bot
        const channel = calculateChannelFIAT(candles);

        // 4) Convertir upper/mid/lower → també en Number()
        const upper = candles.map(c => ({
            time: c.time,
            value: Number(channel.upper)
        }));

        const mid = candles.map(c => ({
            time: c.time,
            value: Number(channel.mid)
        }));

        const lower = candles.map(c => ({
            time: c.time,
            value: Number(channel.lower)
        }));

        // 5) Enviar dades al viewer
        res.json({ candles, upper, mid, lower });

    } catch (err) {
        console.error("❌ Error /chart-data:", err);
        res.json({ candles: [], upper: [], mid: [], lower: [] });
    }
});

// Iniciar servidor
async function startViewer() {
    await initDB();
    const PORT = process.env.PORT || 3001;

    app.listen(PORT, () =>
        console.log(`📈 Viewer FIAT en marxa → http://localhost:${PORT}`)
    );
}

startViewer();
