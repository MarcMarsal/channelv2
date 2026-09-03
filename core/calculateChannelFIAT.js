// Fitxer calculateChannelFIAT.js

// linreg equivalent a TradingView per a un array de valors
// src: array de números (closes)
// len: longitud de la finestra (60)
// offset: desplaçament (0 o 1, com a TradingView)
// endIndex: índex final (última vela = candles.length - 1)
function linreg(src, len, offset, endIndex) {
    const start = endIndex - len + 1 - offset;
    const end   = endIndex - offset;

    if (start < 0) return null;

    const xs = [];
    const ys = [];

    for (let i = 0; i < len; i++) {
        xs.push(i);
        ys.push(src[start + i]);
    }

    const meanX = xs.reduce((a, b) => a + b, 0) / len;
    const meanY = ys.reduce((a, b) => a + b, 0) / len;

    let num = 0;
    let den = 0;

    for (let i = 0; i < len; i++) {
        const dx = xs[i] - meanX;
        const dy = ys[i] - meanY;
        num += dx * dy;
        den += dx * dx;
    }

    if (den === 0) return null;

    const slope = num / den;
    const intercept = meanY - slope * meanX;

    // valor de la recta al punt "len - 1" (equivalent a endy)
    const value = intercept + slope * (len - 1);

    return { slope, intercept, value };
}


export function calculateChannelFIAT(candles) {
    const len = 60;
    const devlenFactor = 1.6;

    if (candles.length < len + 2) {
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

    const endIndex = candles.length - 1;
    const closes = candles.map(c => Number(c.close));

    // --- FIAT MID (sum(src,len)/len) ---
    let sum = 0;
    for (let i = endIndex - len + 1; i <= endIndex; i++) {
        sum += closes[i];
    }
    const mid = sum / len;

    // --- FIAT SLOPE (linreg derivat + suavitzat) ---
    const lr0 = linreg(closes, len, 0, endIndex);
    const lr1 = linreg(closes, len, 1, endIndex);

    if (!lr0 || !lr1) {
        return {
            slope: null,
            intercept: null,
            dev: null,
            devlen: null,
            mid: null,
            upper: null,
            lower: null,
            operable: false,
            reason: "linreg_invalid"
        };
    }

    const raw_slope = lr0.value - lr1.value;

    // suavitzat simple a 3 punts (aprox)
    const slope = raw_slope; // si vols, pots guardar històric i suavitzar

    // --- FIAT INTERCEPT (centrat) ---
    const intercept =
        mid -
        slope * Math.floor(len / 2) +
        ((1 - (len % 2)) / 2) * slope;

    // --- FIAT DEV (quadràtica + recta invertida) ---
    let d = 0;
    for (let i = 0; i < len; i++) {
        const idx = endIndex - i;
        const expected = slope * (len - i) + intercept;
        d += Math.pow(closes[idx] - expected, 2);
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

    const devlen = dev * devlenFactor;

    // --- FIAT CHANNEL (endy = midline) ---
    const endy = intercept + slope * (len - 1);
    const upper = endy + devlen;
    const lower = endy - devlen;

    if (upper <= lower) {
        return {
            slope,
            intercept,
            dev,
            devlen,
            mid: endy,
            upper,
            lower,
            operable: false,
            reason: "upper_lower_invalid"
        };
    }

    // --- OPERABLE (anti-vertical) ---
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
        mid: endy,   // midline = endy (com TradingView)
        upper,
        lower,
        operable,
        reason
    };
}
