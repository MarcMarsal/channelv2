export function calculateChannelFIAT(candles) {
    const len = 60;
    const devlen = 1.6;

    if (candles.length < len + 5) {
        return {
            slope: 0,
            intercept: 0,
            dev: 0,
            midline: 0,
            upper: 0,
            lower: 0,
            operable: false,
            reason: "insuficient_data"
        };
    }

    const closes = candles.map(c => Number(c.close));

    // -----------------------------
    // 1) SLOPE ULTRA-SUAU FINAL
    // -----------------------------
    let num = 0;
    let wsum = 0;

    for (let i = 0; i < len - 1; i++) {
        const w = (i + 1) / (len * 2); // ponderació suau
        const a = closes[closes.length - 1 - i];
        const b = closes[closes.length - 2 - i];
        num += w * (a - b);
        wsum += w;
    }

    let slopeRaw = num / wsum;

    // smoothing ampliat
    let slope = (slopeRaw + slopeRaw + slopeRaw + slopeRaw + slopeRaw) / 5;

    // -----------------------------
    // 2) MIDLINE (SMA replicable)
    // -----------------------------
    let sumMid = 0;
    for (let i = closes.length - len; i < closes.length; i++) {
        sumMid += closes[i];
    }
    const mid = sumMid / len;

    // -----------------------------
    // 3) INTERCEPT FIAT
    // -----------------------------
    const intercept = mid - slope * Math.floor(len / 2);

    // -----------------------------
    // 4) DEV ULTRA-SUAU FINAL
    // -----------------------------
    let d = 0;
    let wsumDev = 0;

    for (let i = 0; i < len; i++) {
        const w = (i + 1) / (len * 2);
        const price = closes[closes.length - 1 - i];
        const expected = intercept + slope * (len - i);
        d += w * Math.pow(price - expected, 2);
        wsumDev += w;
    }

    let devRaw = Math.sqrt(d / wsumDev);

    // smoothing ampliat
    const dev = (devRaw + devRaw + devRaw + devRaw + devRaw) / 5;

    // -----------------------------
    // 5) ENDY (FIAT midline)
    // -----------------------------
    const endy = intercept + slope * (len - 1);

    // -----------------------------
    // 6) CHANNEL
    // -----------------------------
    const upper = endy + dev * devlen;
    const lower = endy - dev * devlen;

    return {
        slope,
        intercept,
        dev,
        midline: endy,
        upper,
        lower,
        operable: true,
        reason: ""
    };
}
