import express from "express";

const app = express();

// Servir carpeta public
app.use(express.static("public"));

// Endpoint de dades
app.get("/chart-data", (req, res) => {
    const candles = [
        { time: 1787381100, open: 77405.4, high: 77546.6, low: 77398.2, close: 77492.8 },
        { time: 1787382000, open: 77492.8, high: 77674.8, low: 77284.2, close: 77378.5 },
        { time: 1787382900, open: 77378.5, high: 77516.4, low: 77231,   close: 77499.2 }
    ];

    const upper = candles.map(c => ({ time: c.time, value: 78000 }));
    const mid   = candles.map(c => ({ time: c.time, value: 77000 }));
    const lower = candles.map(c => ({ time: c.time, value: 76000 }));

    res.json({ candles, upper, mid, lower });
});

// Railway → escoltar en 8080
const PORT = 8080;

app.listen(PORT, () => {
    console.log("Viewer FIAT OK → http://localhost:" + PORT);
});
