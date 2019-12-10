export function round(num, places = 2) {
  const rounded = Number(Math.round(num + 'e+' + places) + 'e-' + places)
  return Number.isNaN(rounded) ? Number(num.toFixed(places)) : rounded
}

export function toHours(ms) {
  return ms / 3600000
}

/**
 * Format time to HH:MM:SS
 *
 * @param {number} time the time in seconds
 * @returns {string} formatted time
 */
export function formatTime(time) {
  const dayInSeconds = 86400
  const hourInSeconds = 3600
  const minuteInSeconds = 60
  const units = ['d', 'h', 'm', 's']

  const days = Math.floor(time / dayInSeconds)
  const hours = Math.floor((time % dayInSeconds) / hourInSeconds)
  const minutes = Math.floor(((time % dayInSeconds) % hourInSeconds) / minuteInSeconds)
  const seconds = ((time % dayInSeconds) % hourInSeconds) % minuteInSeconds

  return [days, hours, minutes, seconds]
    .map((elem, index) => (elem > 0 ? `${elem}${units[index]} ` : ''))
    .join('')
}
