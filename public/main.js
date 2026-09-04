
const chartElement = document.getElementById("chart");

// Crear el gràfic
const chart = LightweightCharts.createChart(chartElement, {
    layout: {
        background: { color: "#111" },
        textColor: "#DDD",
    },
    rightPriceScale: {
        borderColor: "#555",
    },
    timeScale: {
        borderColor: "#555",
    },
});

// Sèrie de veles
const candleSeries = chart.addCandlestickSeries({
    upColor: "#26a69a",
    downColor: "#ef5350",
    borderUpColor: "#26a69a",
    borderDownColor: "#ef5350",
    wickUpColor: "#26a69a",
    wickDownColor: "#ef5350",
});

// Sèries del canal
const upperSeries = chart.addLineSeries({ color: "red", lineWidth: 2 });
const midSeries   = chart.addLineSeries({ color: "blue", lineWidth: 1 });
const lowerSeries = chart.addLineSeries({ color: "green", lineWidth: 2 });

async function loadData(symbol) {
    const res = await fetch(`/chart-data?symbol=${symbol}`);
    const data = await res.json();

    candleSeries.setData(data.candles);
    upperSeries.setData(data.upper);
    midSeries.setData(data.mid);
    lowerSeries.setData(data.lower);
}

// Carregar dades inicials
const selector = document.getElementById("symbolSelector");
loadData(selector.value);

// Canviar symbol
selector.addEventListener("change", () => {
    loadData(selector.value);
});

// Refrescar cada 5s
setInterval(() => {
    loadData(selector.value);
}, 5000);
