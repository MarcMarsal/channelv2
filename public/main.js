const chartEl = document.getElementById("chart");
const selector = document.getElementById("symbolSelector");

const chart = LightweightCharts.createChart(chartEl, {
    layout: { background: { color: "#111" }, textColor: "#DDD" },
    rightPriceScale: { borderColor: "#555" },
    timeScale: { borderColor: "#555" }
});

const candleSeries = chart.addCandlestickSeries();
const upperSeries  = chart.addLineSeries({ color: "red" });
const midSeries    = chart.addLineSeries({ color: "yellow" });
const lowerSeries  = chart.addLineSeries({ color: "green" });

async function load(symbol) {
    const res = await fetch(`/chart-data?symbol=${symbol}`);
    const data = await res.json();

    candleSeries.setData(data.candles);
    upperSeries.setData(data.upper);
    midSeries.setData(data.mid);
    lowerSeries.setData(data.lower);
}

selector.onchange = () => load(selector.value);

// Carrega inicial
load("BTC-USDT");
