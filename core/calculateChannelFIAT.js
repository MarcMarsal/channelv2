export function calculateChannelFIAT(candles) {
    const len = 60;
    const devlenFactor = 1.6;

    if (candles.length < len + 5) {
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

    const closes = candles.map(c => Number(c.close));

    // WINDOW EXACTA com PineScript
    const window = closes.slice(-len);

    // 1) slope ultrasuau final
    let num = 0;
    let wsum = 0;

    for (let i = 0; i < len - 1; i++) {
        const w = (i + 1) / (len * 2);
        num += w * (window[i] - window[i + 1]);
        wsum += w;
    }

    const slopeRaw = num / wsum;

    // smoothing real (no 5× el mateix valor)
    const slope = slopeRaw; // sense historial no es pot fer smoothing temporal

    // 2) mid (SMA)
    const mid = window.reduce((a, b) => a + b, 0) / len;

    // 3) intercept
    const intercept = mid - slope * Math.floor(len / 2);

    // 4) dev ultrasuau final
    let d = 0;
    let wsumDev = 0;

    for (let i = 0; i < len; i++) {
        const w = (i + 1) / (len * 2);
        const expected = intercept + slope * (len - i);
        d += w * Math.pow(window[i] - expected, 2);
        wsumDev += w;
    }

    const devRaw = Math.sqrt(d / wsumDev);
    const dev = devRaw; // igual que slope: sense historial no hi ha smoothing

    // 5) endy
    const endy = intercept + slope * (len - 1);

    // 6) devlen
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
