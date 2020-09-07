import STATUS from '../delay-status-types'

export function getStatus({ executionTime, pausedAt }, now) {
  if (pausedAt) return STATUS.PAUSED

  if (executionTime <= now) return STATUS.PENDING_EXECUTION

  return STATUS.ONGOING
}

export function describePath(path) {
  return path.length
    ? path
        .map((step) => {
          const identifier = step.identifier ? ` (${step.identifier})` : ''
          const app = step.name ? `${step.name}${identifier}` : `${step.to}`

          return `${app}: ${step.description || 'No description'}`
        })
        .join('\n')
    : ''
}
