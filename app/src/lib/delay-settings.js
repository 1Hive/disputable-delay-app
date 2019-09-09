const delaySettings = [
  ['executionDelay', 'executionDelay', 'time'],
  ['delayedScriptsNewIndex', 'delayedScriptsNewIndex'],
]

export function hasLoadedDelaySettings(state) {
  state = state || {}
  return delaySettings.reduce(
    (loaded, [_, key]) => loaded && !!state[key],
    true
  )
}

export default delaySettings
