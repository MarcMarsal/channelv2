import express from "express";
import { initDB, client } from "./db/client.js";
import { calculateChannelFIAT } from "./core/calculateChannelFIAT.js";

console.log("🔥 viewer.js s'ha carregat (Railway ha detectat Node.js)");

const app = express();

// Servir carpeta public
console.log("📦 Servint carpeta public/");
app.use(express.static("public"));

// Endpoint /chart-data
app.get("/chart-data", async (req, res) => {
    console.log("📥 /chart-data CRIDAT");
    console.log("🔎 Symbol rebut:", req.query.symbol);

    try {
        const symbol = req.query.symbol || "BTC-USDT";
        const timeframe = "15m";

        console.log("🧪 Executant SQL per:", symbol, timeframe);

        const candlesRes = await client.query(`
            SELECT *
            FROM candles
            WHERE symbol = $1 AND timeframe = $2
            ORDER BY timestamp DESC
            LIMIT 200
        `, [symbol, timeframe]);

        console.log("📊 Files retornades:", candlesRes.rows.length);

        // 🔥 FIAT: invertir l'ordre perquè ApexCharts vol ASC
        const candles = candlesRes.rows
            .reverse()   // 🔥 ara sí: de més antic → més recent
            .map(c => ({
                time: Math.floor(Number(c.timestamp) / 1000),
                open: Number(c.open),
                high: Number(c.high),
                low: Number(c.low),
                close: Number(c.close)
            }));

        if (candles.length === 0) {
            console.log("⚠️ No hi ha candles per aquest símbol");
            return res.json({ candles: [], upper: [], mid: [], lower: [] });
        }

        const channel = calculateChannelFIAT(candles);
        console.log("📐 Canal FIAT calculat:", channel);

        const upper = candles.map(c => ({ time: c.time, value: channel.upper }));
        const mid   = candles.map(c => ({ time: c.time, value: channel.mid }));
        const lower = candles.map(c => ({ time: c.time, value: channel.lower }));

        console.log("📤 Enviant JSON FIAT");
        res.json({ candles, upper, mid, lower });

    } catch (err) {
        console.error("❌ Error /chart-data:", err);
        res.json({ candles: [], upper: [], mid: [], lower: [] });
    }
});

async function startViewer() {
    console.log("🚀 Iniciant FIAT Viewer…");

    await initDB();
    console.log("🗄️ DB inicialitzada correctament");

    const PORT = process.env.PORT || 8080;
    console.log("📡 Escoltant al port:", PORT);

    app.listen(PORT, () =>
        console.log(`📈 FIAT Viewer en marxa → http://localhost:${PORT}`)
    );
}

startViewer();
