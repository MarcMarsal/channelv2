console.log("🔥 main.js carregat");

const selector = document.getElementById("symbolSelector");
const chartEl = document.getElementById("chart");

let chart;

async function load(symbol) {
    console.log("🔄 Carregant dades per:", symbol);

    const res = await fetch(`/chart-data?symbol=${symbol}`);
    const data = await res.json();

    console.log("📦 JSON rebut:", data);

    const candles = data.candles.map(c => ({
        x: new Date(c.time * 1000),
        y: [c.open, c.high, c.low, c.close]
    }));

    const upper = data.upper.map(p => ({ x: new Date(p.time * 1000), y: p.value }));
    const mid   = data.mid.map(p => ({ x: new Date(p.time * 1000), y: p.value }));
    const lower = data.lower.map(p => ({ x: new Date(p.time * 1000), y: p.value }));

    const options = {
        chart: {
            type: 'candlestick',
            height: '100%',
            background: '#111',
            foreColor: '#DDD'
        },
        series: [{
            name: 'Candles',
            data: candles
        },{
            name: 'Upper',
            type: 'line',
            data: upper
        },{
            name: 'Mid',
            type: 'line',
            data: mid
        },{
            name: 'Lower',
            type: 'line',
            data: lower
        }],
        xaxis: { type: 'datetime' }
    };

    if (chart) chart.destroy();
    chart = new ApexCharts(chartEl, options);
    chart.render();

    console.log("📊 Dades aplicades al gràfic");
}

selector.onchange = () => load(selector.value);

// Carrega inicial
load("BTC-USDT");
