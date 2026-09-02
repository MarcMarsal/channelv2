// -------------------------------------------------------------
// DATE HELPERS FIAT‑PRO (igual que abans)
// -------------------------------------------------------------
export function formatSpainTime(tsMs) {
  if (tsMs === null || tsMs === undefined) return "-";

  const n = Number(String(tsMs).trim());
  if (!Number.isFinite(n)) return "-";

  const d = new Date(n);
  if (isNaN(d.getTime())) return "-";

  return d.toLocaleTimeString("es-ES", {
    hour12: false,
    timeZone: "Europe/Madrid"
  });
}

export function splitSpainDate(tsMs) {
  const n = Number(String(tsMs).trim());
  const d = new Date(n);

  if (isNaN(d.getTime())) {
    return {
      date_es: "-",
      hora_es: "-",
      timestamp_es: n
    };
  }

  const dateFormatter = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const timeFormatter = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const dateParts = dateFormatter.formatToParts(d);
  const day   = dateParts.find(p => p.type === "day").value;
  const month = dateParts.find(p => p.type === "month").value;
  const year  = dateParts.find(p => p.type === "year").value;

  const timeParts = timeFormatter.formatToParts(d);
  const hour   = timeParts.find(p => p.type === "hour").value;
  const minute = timeParts.find(p => p.type === "minute").value;
  const second = timeParts.find(p => p.type === "second").value;

  return {
    date_es: `${day}/${month}/${year}`,
    hora_es: `${hour}:${minute}:${second}`,
    timestamp_es: n
  };
}

export function getDay(tsMs) {
  const n = Number(String(tsMs).trim());
  const d = new Date(n);
  if (isNaN(d.getTime())) return null;
  return d.getDay();
}

// -------------------------------------------------------------
// FIAT 15m — ATR (per filtrar soroll i mètxes)
// -------------------------------------------------------------
export function calcATR(candles, period = 14) {
  if (!candles || candles.length < period + 1) return null;

  let trs = [];

  for (let i = 1; i < period + 1; i++) {
    const c = candles[candles.length - i];
    const p = candles[candles.length - i - 1];

    const high = Number(c.high);
    const low = Number(c.low);
    const prevClose = Number(p.close);

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trs.push(tr);
  }

  const atr = trs.reduce((a, b) => a + b, 0) / period;
  return atr;
}

// -------------------------------------------------------------
// FIAT 15m — Mètxa (per SL FIAT)
// -------------------------------------------------------------
export function getWickSize(candle, direction) {
  const high = Number(candle.high);
  const low = Number(candle.low);
  const close = Number(candle.close);

  if (direction === "long") {
    return Math.abs(low - close);
  } else {
    return Math.abs(high - close);
  }
}

// -------------------------------------------------------------
// FIAT 15m — Percentatge
// -------------------------------------------------------------
export function pct(a, b) {
  return Math.abs((a - b) / b);
}

// -------------------------------------------------------------
// FIAT 15m — Slope smoothing
// -------------------------------------------------------------
export function smoothSlope(slope, factor = 0.85) {
  return slope * factor;
}

// -------------------------------------------------------------
// FIAT 15m — Detectar si una vela està fora del canal
// -------------------------------------------------------------
export function isOutsideChannel(close, upper, lower) {
  if (close > upper) return "upper";
  if (close < lower) return "lower";
  return null;
}

// -------------------------------------------------------------
// FIAT 15m — Detectar reingrés
// -------------------------------------------------------------
export function isReingress(prevClose, lastClose, upper, lower) {
  const prevOutside =
    prevClose > upper || prevClose < lower;

  const nowInside =
    lastClose <= upper && lastClose >= lower;

  return prevOutside && nowInside;
}

// -------------------------------------------------------------
// FIAT 15m — RR
// -------------------------------------------------------------
export function calcRR(entry, tp, sl, type) {
  if (type === "LONG") {
    return (tp - entry) / (entry - sl);
  } else {
    return (entry - tp) / (sl - entry);
  }
}
