function appStateReducer(state) {
  const ready = state && state.executionDelay //has loaded settings

  if (!ready) {
    return { ...state, ready }
  }

  const { delayedScripts } = state

  return {
    ...state,
    ready,
    delayedScripts: delayedScripts
      ? delayedScripts.map(script => ({
          ...script,
          executionTime: new Date(script.executionTime),
          pausedAt: new Date(script.pausedAt),
        }))
      : [],
  }
}

export default appStateReducer
