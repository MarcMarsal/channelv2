// fitxer calcularAccioFIAT.js

export function calcularAccioFIAT(open, close, upper, lower) {

    if (open < upper && close > upper)
        return "breakout_superior";

    if (open > lower && close < lower)
        return "breakout_inferior";

    if (open > upper && close < upper)
        return "reingres_superior";

    if (open < lower && close > lower)
        return "reingres_inferior";

    return "";
}
