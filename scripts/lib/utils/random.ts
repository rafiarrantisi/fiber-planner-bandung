import seedrandom from 'seedrandom'

export function createRng(seed: string) {
  const rng = seedrandom(seed)
  return {
    next: () => rng(),
    range: (min: number, max: number) => min + rng() * (max - min),
    int: (min: number, max: number) =>
      Math.floor(min + rng() * (max - min + 1)),
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)],
    weightedPick: <T>(items: readonly { value: T; weight: number }[]): T => {
      const total = items.reduce((acc, i) => acc + i.weight, 0)
      let r = rng() * total
      for (const item of items) {
        r -= item.weight
        if (r <= 0) return item.value
      }
      return items[items.length - 1].value
    },
    jitter: (value: number, pct: number): number => {
      const delta = value * pct * (rng() * 2 - 1)
      return value + delta
    },
  }
}

export type Rng = ReturnType<typeof createRng>
