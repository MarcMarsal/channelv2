// core/logic/signal_builder.js

export function buildSignalFIAT(symbol, last, TP, SL, cas) {
  return {
    symbol,
    timestamp: last.timestamp,
    accio: last.accio,
    open: last.open,
    close: last.close,
    upper: last.upper,
    lower: last.lower,
    mid: last.mid,
    cas,
    TP,
    SL
  };
}
