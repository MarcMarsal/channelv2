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
            midline: 0,
            upper: 0,
            lower: 0,
            operable: false,
            reason: "insuficient_data"
        };
    }

    // Últimes len veles
    const closes = candles.map(c => Number(c.close));
    const window = closes.slice(-len);

    // 1) SLOPE SUAU (ponderació suau)
    let num = 0;
    let wsum = 0;

    for (let i = 0; i < len - 1; i++) {
        const w = (i + 1) / (len * 2);   // ponderació suau
        num += w * (window[i] - window[i + 1]);
        wsum += w;
    }

    const slope = num / wsum;

    // 2) MID (SMA)
    const mid = window.reduce((a, b) => a + b, 0) / len;

    // 3) INTERCEPT centrat
    const intercept = mid - slope * Math.floor(len / 2);

    // 4) DEV SUAU (ponderació suau)
    let d = 0;
    let wsumDev = 0;

    for (let i = 0; i < len; i++) {
        const w = (i + 1) / (len * 2);
        const expected = intercept + slope * (len - i);
        d += w * Math.pow(window[i] - expected, 2);
        wsumDev += w;
    }

    const dev = Math.sqrt(d / wsumDev);

    // 5) ENDY (punt final del canal)
    const endy = intercept + slope * (len - 1);

    // 6) CANAL
    const devlen = dev * devlenFactor;
    const upper = endy + devlen;
    const lower = endy - devlen;

    return {
        slope,
        intercept,
        dev,
        devlen,
        mid: endy,
        midline: endy,
        upper,
        lower,
        operable: true,
        reason: ""
    };
}
