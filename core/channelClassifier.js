// core/channelClassifier.js — FIAT 15m (canal + operabilitat + slope + rang)

export function classifyChannel(channel) {
  // En 15m NO apliquem K (canal reactiu)
  const k = 1;

  // Canal matemàtic pur
  const upper_raw = channel.endy + channel.dev * channel.devlen;
  const lower_raw = channel.endy - channel.dev * channel.devlen;

  // Canal corregit amb K
  const upper = channel.endy + (upper_raw - channel.endy) * k;
  const lower = channel.endy + (lower_raw - channel.endy) * k;

  // Slope percentual FIAT (15m = més permissiu)
  const slope_pct = Math.abs(channel.slope / channel.mid);

  let operable = true;
  let reason = null;

  // -------------------------------------------------------------
  // FIAT 15m — criteris adaptats a temporalitat baixa
  // -------------------------------------------------------------

  // 1) Canal massa ample (>6%)
  if ((upper - lower) / channel.mid > 0.06) {
    operable = false;
    reason = "canal massa ample";

  // 2) Canal massa estret (<0.3%)
  } else if ((upper - lower) / channel.mid < 0.003) {
    operable = false;
    reason = "canal massa estret";

  // 3) Slope inestable (percentual)
  // 15m = slope més volàtil → llindar més alt
  } else if (slope_pct > 0.00035) {   // 0.035% per vela
    operable = false;
    reason = "slope inestable";

  // 4) Dev exagerada (>1.5%)
  // En 15m la dev és més petita
  } else if (channel.dev / channel.mid > 0.015) {
    operable = false;
    reason = "dev exagerada";

  // 5) Devlen FIAT 15m (rang més curt)
  } else if (channel.devlen < 0.8 || channel.devlen > 2.2) {
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
