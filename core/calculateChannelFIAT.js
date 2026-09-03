// Fitxer calculateChannelFIAT.js

export function calculateChannelFIAT(candles) {
    const len = 60;

    if (candles.length < len) {
        return {
            slope: null,
            intercept: null,
            dev: null,
            devlen: null,
            mid: null,
            upper: null,
            lower: null,
            operable: false,
            reason: "insuficient_data"
        };
    }

    // Últimes 60 veles
    const slice = candles.slice(-len);
    const closes = slice.map(c => Number(c.close));

    // -------------------------------------------------------------
    // 1) MID (TradingView: sum(src,len)/len)
    // -------------------------------------------------------------
    const mid = closes.reduce((a, b) => a + b, 0) / len;

    // -------------------------------------------------------------
    // 2) SLOPE aproximat (regressió simple)
    // -------------------------------------------------------------
    const xs = [...Array(len).keys()]; // 0..59
    const meanX = xs.reduce((a, b) => a + b, 0) / len;
    const meanY = closes.reduce((a, b) => a + b, 0) / len;

    let num = 0;
    let den = 0;

    for (let i = 0; i < len; i++) {
        const dx = xs[i] - meanX;
        const dy = closes[i] - meanY;
        num += dx * dy;
        den += dx * dx;
    }

    if (den === 0) {
        return {
            slope: null,
            intercept: null,
            dev: null,
            devlen: null,
            mid,
            upper: null,
            lower: null,
            operable: false,
            reason: "den_zero"
        };
    }

    let slope = num / den;

    // -------------------------------------------------------------
    // 3) SLOPE suavitzat (com TradingView)
    //    smooth_slope = (raw + raw[1] + raw[2]) / 3
    // -------------------------------------------------------------
    // Nota: no tenim raw_slope real (linreg), però suavitzem igualment
    const slopeHistory = [slope];
    if (candles.length >= len + 1) {
        slopeHistory.push(slopeHistory[0]); // aproximació
        slopeHistory.push(slopeHistory[0]);
    }
    slope = (slopeHistory[0] + slopeHistory[1] + slopeHistory[2]) / 3;

    // -------------------------------------------------------------
    // 4) INTERCEPT centrat (TradingView)
    // -------------------------------------------------------------
    const intercept =
        mid -
        slope * Math.floor(len / 2) +
        ((1 - (len % 2)) / 2) * slope;

    // -------------------------------------------------------------
    // 5) DEV quadràtica + recta invertida (TradingView)
    // -------------------------------------------------------------
    let d = 0;
    for (let i = 0; i < len; i++) {
        const expected = slope * (len - i) + intercept;
        d += Math.pow(closes[i] - expected, 2);
    }
    const dev = Math.sqrt(d / len);

    if (!dev || dev === 0) {
        return {
            slope,
            intercept,
            dev: null,
            devlen: null,
            mid,
            upper: null,
            lower: null,
            operable: false,
            reason: "dev_zero"
        };
    }

    const devlen = dev * 1.6;

    const endy = intercept + slope * (len - 1);

    const upper = endy + devlen;
    const lower = endy - devlen;

    if (upper <= lower) {
        return {
            slope,
            intercept,
            dev,
            devlen,
            mid,
            upper,
            lower,
            operable: false,
            reason: "upper_lower_invalid"
        };
    }

    // -------------------------------------------------------------
    // 6) OPERABLE
    // -------------------------------------------------------------
    let operable = true;
    let reason = "";

    if (Math.abs(slope) > 0.0025) {
        operable = false;
        reason = "vertical_mode";
    }

    return {
        slope,
        intercept,
        dev,
        devlen,
        mid: endy,     // TradingView: midline = endy
        upper,
        lower,
        operable,
        reason
    };
}
