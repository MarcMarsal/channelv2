// core/channelClassifier.js — FIAT‑PRO canal + operabilitat

export function classifyChannel(channel) {
  const k = 0.8;

  // Canal matemàtic pur
  const upper_raw = channel.endy + channel.dev * channel.devlen;
  const lower_raw = channel.endy - channel.dev * channel.devlen;

  // Canal corregit amb K
  const upper = channel.endy + (upper_raw - channel.endy) * k;
  const lower = channel.endy + (lower_raw - channel.endy) * k;

  // Classificació FIAT‑PRO
  let operable = true;
  let reason = null;

  if ((upper - lower) / channel.mid > 0.10) {
    operable = false;
    reason = "canal massa ample";
  } else if ((upper - lower) / channel.mid < 0.005) {
    operable = false;
    reason = "canal massa estret";
  } else if (Math.abs(channel.slope) > 0.002) {
    operable = false;
    reason = "slope inestable";
  } else if (channel.dev / channel.mid > 0.02) {
    operable = false;
    reason = "dev exagerada";
  } else if (channel.devlen < 1.0 || channel.devlen > 3.0) {
    operable = false;
    reason = "devlen incoherent";
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
