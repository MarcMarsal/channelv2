// core/logic/signal_builder.js

export function buildSignal({ tp, sl, alertText }) {
  return {
    tp,
    sl,
    alert: alertText
  };
}
