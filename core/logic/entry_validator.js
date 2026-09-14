// core/logic/entry_validator.js
// Pure Lonesome entry rules

export function shouldEnter(cas) {
  if (cas === 2) return true; // breakout + reingrés immediat
  if (cas === 3) return true; // reingrés tardà
  return false;               // soroll o no context
}
