import STATUS from '../delay-status-types'

export function getStatus({ executionTime, pausedAt }, now) {
  if (pausedAt) return STATUS.PAUSED

  if (executionTime <= now) return STATUS.PENDING_EXECUTION

  return STATUS.ONGOING
}
