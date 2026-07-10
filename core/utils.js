// core/utils.js — FIAT‑PRO

export function splitSpainDate(tsMs) {
  const d = new Date(tsMs);

  const date_es = d.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const hora_es = d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  return {
    date_es,
    hora_es,
    timestamp_es: tsMs
  };
}
