export function calculateChannelFIAT(candles) {
    const len = 60;

    // -------------------------------------------------------------
    // 0) DADES INSUFICIENTS
    // -------------------------------------------------------------
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
    // 1) REGRESSIÓ LINEAL
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
            mid: null,
            upper: null,
            lower: null,
            operable: false,
            reason: "den_zero"
        };
    }

    const slope = num / den;
    const intercept = meanY - slope * meanX;

    // -------------------------------------------------------------
    // 2) MID, UPPER, LOWER
    // -------------------------------------------------------------
    const mid = intercept + slope * (len - 1);

    const deviations = closes.map((c, i) => Math.abs(c - (intercept + slope * i)));
    const dev = deviations.reduce((a, b) => a + b, 0) / len;

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

    if (!devlen || devlen === 0) {
        return {
            slope,
            intercept,
            dev,
            devlen: null,
            mid,
            upper: null,
            lower: null,
            operable: false,
            reason: "devlen_zero"
        };
    }

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
    // 3) OPERABLE
    // -------------------------------------------------------------
    let operable = true;
    let reason = "";

    if (Math.abs(slope) > 0.0025) { // FIAT anti-vertical
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
