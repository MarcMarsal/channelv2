export function calculateChannelFIAT(candles) {
    const len = 60;
    const devlenFactor = 1.6;

    if (candles.length < len) {
        return {
            slope: 0,
            intercept: 0,
            dev: 0,
            devlen: 0,
            mid: 0,
            upper: 0,
            lower: 0,
            operable: false,
            reason: "insuficient_data"
        };
    }

    const closes = candles.map(c => Number(c.close));
    const window = closes.slice(-len);

    // -----------------------------
    // 1) linreg equivalent
    // -----------------------------
    function linRegEquivalent(values, len, offset) {
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;

        for (let i = 0; i < len; i++) {
            const x = i;                     // 0 = antic, len-1 = actual
            const y = values[len - 1 - i];   // indexació correcta
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        }

        const slope = (len * sumXY - sumX * sumY) / (len * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / len;

        const xTarget = len - 1 - offset;   // offset 0 = actual
        return intercept + slope * xTarget;
    }

    // slope equivalent a TradingView
    const lr0 = linRegEquivalent(window, len, 0);
    const lr1 = linRegEquivalent(window, len, 1);
    const slope = lr0 - lr1;

    // mid equivalent
    const mid = window.reduce((a, b) => a + b, 0) / len;

    // intercept equivalent
    const intercept =
        mid -
        slope * Math.floor(len / 2) +
        ((1 - (len % 2)) / 2) * slope;

    // endy equivalent
    const endy = intercept + slope * (len - 1);

    // desviació equivalent
    let dev = 0;
    for (let x = 0; x < len; x++) {
        const expected = slope * (len - x) + intercept;
        dev += Math.pow(window[x] - expected, 2);
    }
    dev = Math.sqrt(dev / len);

    const devlen = dev * devlenFactor;

    return {
        slope,
        intercept,
        dev,
        devlen,
        mid: endy,
        upper: endy + devlen,
        lower: endy - devlen,
        operable: true,
        reason: ""
    };
}
