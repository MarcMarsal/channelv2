export function calculateChannelFIAT(candles) {
    const len = 60;
    const k = 1.6; // desviació FIAT

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

    // Últimes len veles
    const slice = candles.slice(-len);
    const closes = slice.map(c => Number(c.close));

    // -------------------------------------------------------------
    // 1) REGRESSIÓ LINEAL (OLS institucional)
    // -------------------------------------------------------------
    const xs = [...Array(len).keys()]; // 0..len-1
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
            mid: null,
            upper: null,
            lower: null,
            operable: false,
            reason: "den_zero"
        };
    }

    const slope = num / den;
    const intercept = meanY - slope * meanX;

    // midline = recta al punt final (FIAT)
    const mid = intercept + slope * (len - 1);

    // -------------------------------------------------------------
    // 2) DESVIACIÓ ESTÀNDARD REAL (σ)
    // -------------------------------------------------------------
    let sumSq = 0;
    for (let i = 0; i < len; i++) {
        const expected = intercept + slope * i;
        sumSq += Math.pow(closes[i] - expected, 2);
    }

    const dev = Math.sqrt(sumSq / len);

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

    const devlen = dev * k;

    // -------------------------------------------------------------
    // 3) FIAT CHANNEL (institucional)
    // -------------------------------------------------------------
    const upper = mid + devlen;
    const lower = mid - devlen;

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
    // 4) OPERABLE (anti-vertical FIAT)
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
        mid,
        upper,
        lower,
        operable,
        reason
    };
}
