/*   
If script is paused then Boolean(pausedAt) = 1 
If function returns value < 0 then script1 goes before script2

paused ?
| script1 | script2 | result 
-------------------------------------------------------------------------------------------------------------
|    _    |    _    | script1.executionTime - script2.executionTime
|    _    |    X    | -1
|    X    |    _    | 1
|    X    |    X    | (script1.executionTime - script1.pausedAt) - (script2.executionTime - script2.pausedAT) 

Legend:  (_ means 0, X means 1)
*/

const compareDelayedScripts = (script1, script2) => {
  const diff = Boolean(script1.pausedAt) - Boolean(script2.pausedAt)
  if (diff !== 0) return diff

  const timeRemainingScript1 = script1.executionTime - script2.pausedAt
  const timeRemainingScript2 = script1.executionTime - script2.pausedAt

  return timeRemainingScript1 - timeRemainingScript2
}

function appStateReducer(state) {
  const ready = state && state.executionDelay // has loaded settings

  if (!ready) {
    return { ...state, ready }
  }

  const { delayedScripts } = state

  return {
    ...state,
    ready,
    delayedScripts: delayedScripts
      ? delayedScripts.sort(compareDelayedScripts).map(script => ({
          ...script,
          executionTime: new Date(script.executionTime),
        }))
      : [],
  }
}

export default appStateReducer
