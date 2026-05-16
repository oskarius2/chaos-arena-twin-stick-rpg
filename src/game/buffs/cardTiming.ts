export function getCardIntervalSeconds(stage: number): number {
  return stage >= 5 ? 55 : 75;
}

export function getNextLevelExp(current: number): number {
  return Math.floor(current * 1.75 + 2200);
}
