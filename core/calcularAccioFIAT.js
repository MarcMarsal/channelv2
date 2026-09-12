// fitxer calcularAccioFIAT.js — versió FI sense globals

export function calcularAccioFIAT(open, close, upper, lower) {

    // Detectar acció FIAT pura (sense persistència)
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
