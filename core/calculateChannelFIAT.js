// fitxer calculateChannelFIAT.js

function calculateChannelFIAT(candles) {
    const len = 60; // tram del canal
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

    // Agafem les últimes 60 veles
    const slice = candles.slice(-len);
    const closes = slice.map(c => c.close);

    // ------------------------------
    // 1) REGRESSIÓ LINEAL CANÒNICA
    // ------------------------------

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

    const slope = den === 0 ? 0 : num / den;
    const intercept = meanY - slope * meanX;

    // ------------------------------
    // 2) MID, UPPER, LOWER
    // ------------------------------

    const mid = intercept + slope * (len - 1); // punt final del canal

    // dev = desviació mitjana absoluta
    const deviations = closes.map((c, i) => Math.abs(c - (intercept + slope * i)));
    const dev = deviations.reduce((a, b) => a + b, 0) / len;

    const devlen = dev * 1.6; // factor LonesomeTheBlue

    const upper = mid + devlen;
    const lower = mid - devlen;

    // ------------------------------
    // 3) OPERABLE + REASON
    // ------------------------------

    let operable = true;
    let reason = "";

    if (devlen === 0) {
        operable = false;
        reason = "devlen_zero";
    }

    if (slope === 0) {
        // no bloqueja, només informa
        reason = reason ? reason + ", slope_zero" : "slope_zero";
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
