/**
 * Seeded PRNG. Math.random() is deliberately never used in the fixtures:
 * a demo that reshuffles its own data on every reload is impossible to talk
 * over, and impossible to screenshot twice.
 */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length) % arr.length]
}

/** Inclusive integer in [min, max]. */
export function int(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Two-decimal amount in [min, max]. */
export function amount(rng, min, max) {
  return Math.round((min + rng() * (max - min)) * 100) / 100
}

export function chance(rng, p) {
  return rng() < p
}

/** ISO date `days` after `startIso`, as a plain calendar date. */
export function addDays(startIso, days) {
  const [y, m, d] = startIso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}
