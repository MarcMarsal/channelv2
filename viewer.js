import express from "express";
import { initDB, client } from "./db/client.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";

const app = express();

// Servir carpeta public
app.use(express.static("public"));

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

        const upper = candles.map(c => ({ time: c.time, value: channel.upper }));
        const mid   = candles.map(c => ({ time: c.time, value: channel.mid }));
        const lower = candles.map(c => ({ time: c.time, value: channel.lower }));

        res.json({ candles, upper, mid, lower });

    } catch (err) {
        console.error("❌ Error /chart-data:", err);
        res.json({ candles: [], upper: [], mid: [], lower: [] });
    }
});

async function startViewer() {
    await initDB();

    // Railway exposa aquest port
    const PORT = process.env.PORT || 8080;

    app.listen(PORT, () => {
        console.log(`📈 Viewer FIAT en marxa → port Railway ${PORT}`);
    });
}

startViewer();
