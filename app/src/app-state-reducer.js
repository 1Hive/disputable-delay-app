/*   
If script is paused then Boolean(pausedAt) = 1 
If function returns value < 0 then s1 goes before s2

paused ?
| s1 | s2 | result |
--------------------------
| _  | _  | s1.executionTime - s2.executionTime
| _  | X  | -1
| X  | _  | 1
| X  | X  | (s1.executionTime - s1.pausedAt) - (s2.executionTime - s2.pausedAT) 

Legend:  (_ means 0, X means 1)
*/

const compareScripts = (s1, s2) => {
  const diff = Boolean(s1.pausedAt) - Boolean(s2.pausedAt)
  if (diff !== 0) return diff

  const timeRemainingS1 = s1.executionTime - s1.pausedAt
  const timeRemainginS2 = s2.executionTime - s2.pausedAt

  return timeRemainingS1 - timeRemainginS2
}

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
      ? delayedScripts.sort(compareScripts).map(script => ({
          ...script,
          executionTime: new Date(script.executionTime),
        }))
      : [],
  }
}

export default appStateReducer
