export function calculateChannelFIAT(candles) {
    const len = 100;              // igual que TradingView
    const devlenFactor = 1.6;     // igual que TradingView

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
    const window = closes.slice(-len); // [antic ... recent]

    // 1) regressió lineal sobre dades cronològiques
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < len; i++) {
        const x = i;            // 0 = més antic, len-1 = més recent
        const y = window[i];    // cronològic
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }

    const slopeReg = (len * sumXY - sumX * sumY) / (len * sumXX - sumX * sumX);
    const interceptReg = (sumY - slopeReg * sumX) / len;

    // valors a les dues últimes barres (equivalent a offset 0 i 1)
    const lr0 = interceptReg + slopeReg * (len - 1); // barra actual
    const lr1 = interceptReg + slopeReg * (len - 2); // barra anterior

    const slope = lr0 - lr1;

    // 2) mid (SMA)
    const mid = window.reduce((a, b) => a + b, 0) / len;

    // 3) intercept centrat (equivalent a Lonesome)
    const intercept =
        mid -
        slope * Math.floor(len / 2) +
        ((1 - (len % 2)) / 2) * slope;

    // 4) desviació
    let devSum = 0;
    for (let i = 0; i < len; i++) {
        // mapeig aproximat de la fórmula de Pine a cronologia
        const expected = intercept + slope * (i + 1);
        devSum += Math.pow(window[i] - expected, 2);
    }
    const dev = Math.sqrt(devSum / len);

    // 5) endy
    const endy = intercept + slope * (len - 1);

    const devlen = dev * devlenFactor;
    const upper = endy + devlen;
    const lower = endy - devlen;

    return {
        slope,
        intercept,
        dev,
        devlen,
        mid: endy,
        upper,
        lower,
        operable: true,
        reason: ""
    };
}
