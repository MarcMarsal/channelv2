console.log("🔥 main.js carregat (el navegador l'ha trobat)");

const chartEl = document.getElementById("chart");
console.log("🧱 Element chart:", chartEl);

const selector = document.getElementById("symbolSelector");
console.log("🎛️ Selector trobat:", selector);

console.log("📈 Inicialitzant Lightweight Charts…");
const chart = LightweightCharts.createChart(chartEl, {
    layout: { background: { color: "#111" }, textColor: "#DDD" },
    rightPriceScale: { borderColor: "#555" },
    timeScale: { borderColor: "#555" }
});

console.log("📈 Lightweight Charts inicialitzat");

const candleSeries = chart.addCandlestickSeries();
const upperSeries  = chart.addLineSeries({ color: "red" });
const midSeries    = chart.addLineSeries({ color: "yellow" });
const lowerSeries  = chart.addLineSeries({ color: "green" });

async function load(symbol) {
    console.log("🔄 Carregant dades per:", symbol);

    const res = await fetch(`/chart-data?symbol=${symbol}`);
    console.log("📥 Resposta /chart-data:", res);

    const data = await res.json();
    console.log("📦 JSON rebut:", data);

    candleSeries.setData(data.candles);
    upperSeries.setData(data.upper);
    midSeries.setData(data.mid);
    lowerSeries.setData(data.lower);

    console.log("📊 Dades aplicades al gràfic");
}

selector.onchange = () => {
    console.log("🔁 Canvi de símbol:", selector.value);
    load(selector.value);
};

// Carrega inicial
load("BTC-USDT");
