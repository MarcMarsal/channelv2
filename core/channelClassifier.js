// core/channelClassifier.js — FIAT‑PRO canal + operabilitat (slope percentual)

export function classifyChannel(channel) {
  //const k = 0.8;
  const k = 1;

  // Canal matemàtic pur
  const upper_raw = channel.endy + channel.dev * channel.devlen;
  const lower_raw = channel.endy - channel.dev * channel.devlen;

  // Canal corregit amb K
  const upper = channel.endy + (upper_raw - channel.endy) * k;
  const lower = channel.endy + (lower_raw - channel.endy) * k;

  // Slope percentual FIAT‑PRO
  const slope_pct = Math.abs(channel.slope / channel.mid);

  // Classificació FIAT‑PRO
  let operable = true;
  let reason = null;

  // 1) Canal massa ample (>10%)
  if ((upper - lower) / channel.mid > 0.10) {
    operable = false;
    reason = "canal massa ample";

  // 2) Canal massa estret (<0.5%)
  } else if ((upper - lower) / channel.mid < 0.005) {
    operable = false;
    reason = "canal massa estret";

  // 3) Slope inestable (percentual)
  } else if (slope_pct > 0.0002) {   // 0.02% per vela
    operable = false;
    reason = "slope inestable";

  // 4) Dev exagerada (>2%)
  } else if (channel.dev / channel.mid > 0.02) {
    operable = false;
    reason = "dev exagerada";

  // 5) Devlen incoherent
  } else if (channel.devlen < 1.0 || channel.devlen > 3.0) {
    operable = false;
    reason = "devlen incoherent";

  // 6) Upper/lower invertits
  } else if (upper < channel.mid || lower > channel.mid) {
    operable = false;
    reason = "upper/lower invertits";
  }

  return {
    upper,
    lower,
    k,
    operable,
    reason
  };
}
