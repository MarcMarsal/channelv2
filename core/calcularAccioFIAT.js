// fitxer calcularAccioFIAT.js

let lastAccio = "";
let breakoutAge = null;

export function calcularAccioFIAT(open, close, upper, lower) {

    // 1) Detectar acció actual FIAT (com abans)
    let accioActual = "";

    if (open < upper && close > upper)
        accioActual = "breakout_superior";

    else if (open > lower && close < lower)
        accioActual = "breakout_inferior";

    else if (open > upper && close < upper)
        accioActual = "reingres_superior";

    else if (open < lower && close > lower)
        accioActual = "reingres_inferior";

    else
        accioActual = "";

    // -------------------------------------------------------------
    // 2) PATCH INSTITUCIONAL — Persistència del breakout 1–2 veles
    // -------------------------------------------------------------

    // Si hi ha breakout → reiniciem comptador
    if (accioActual === "breakout_superior" || accioActual === "breakout_inferior") {
        breakoutAge = 0;
        lastAccio = accioActual;
        return accioActual;
    }

    // Si NO hi ha breakout, però breakoutAge = 0 → persistim 1a vela
    if (breakoutAge === 0) {
        breakoutAge = 1;
        return lastAccio; // mantenim breakout
    }

    // Si breakoutAge = 1 → persistim 2a vela
    if (breakoutAge === 1) {
        breakoutAge = 2;
        return lastAccio; // mantenim breakout
    }

    // Si breakoutAge >= 2 → ja no persistim breakout
    breakoutAge = null;
    lastAccio = accioActual;

    return accioActual;
}
