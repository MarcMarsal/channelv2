
const chartElement = document.getElementById("chart");

const chart = LightweightCharts.createChart(chartElement, {
    layout: { background: { color: "#111" }, textColor: "#DDD" },
    rightPriceScale: { borderColor: "#555" },
    timeScale: { borderColor: "#555" }
});

const candleSeries = chart.addCandlestickSeries();
const upperSeries  = chart.addLineSeries({ color: "red" });
const midSeries    = chart.addLineSeries({ color: "blue" });
const lowerSeries  = chart.addLineSeries({ color: "green" });

async function loadData() {
    const res = await fetch("/chart-data");
    const data = await res.json();

    candleSeries.setData(data.candles);
    upperSeries.setData(data.upper);
    midSeries.setData(data.mid);
    lowerSeries.setData(data.lower);
}

loadData();
