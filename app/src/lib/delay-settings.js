//contract getter | variableName | data type
const delaySettings = [['executionDelay', 'executionDelay', 'time']]

export function hasLoadedDelaySettings(state) {
  state = state || {}
  return delaySettings.reduce(
    (loaded, [_, key]) => loaded && !!state[key],
    true
  )
}

export default delaySettings
