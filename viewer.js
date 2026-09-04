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

        const candlesRes = await client.query(`
            SELECT *
            FROM candles
            WHERE symbol = $1 AND timeframe = $2
            ORDER BY timestamp ASC
            LIMIT 200
        `, [symbol, timeframe]);

        const candles = candlesRes.rows.map(c => ({
            // assume DB guarda ms → passem a segons per Lightweight Charts
            time: Math.floor(Number(c.timestamp) / 1000),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close)
        }));

        if (candles.length === 0) {
            return res.json({ candles: [], upper: [], mid: [], lower: [] });
        }

        const channel = calculateChannelFIAT(candles);

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

        res.json({ candles, upper, mid, lower });

    } catch (err) {
        console.error("❌ Error /chart-data:", err);
        res.json({ candles: [], upper: [], mid: [], lower: [] });
    }
});

async function startViewer() {
    await initDB();
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () =>
        console.log(`📈 Viewer FIAT en marxa → http://localhost:${PORT}`)
    );
}

startViewer();
