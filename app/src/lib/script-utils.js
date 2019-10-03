export function canExecute({ executionTime, pausedAt }, now) {
  return executionTime <= now && !pausedAt
}
