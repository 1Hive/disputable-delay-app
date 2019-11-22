/*   
If script is paused then Boolean(pausedAt) = 1 
If function returns value < 0 then ds1 goes before ds2

paused ?
| s1 | s2 | result |
--------------------------
| _  | _  | ds1.executionTime - ds2.executionTime
| _  | X  | -1
| X  | _  | 1
| X  | X  | (ds1.executionTime - ds1.pausedAt) - (ds2.executionTime - ds2.pausedAT) 

Legend:  (_ means 0, X means 1)
*/

const compareDelayedScripts = (ds1, ds2) => {
  const diff = Boolean(ds1.pausedAt) - Boolean(ds2.pausedAt)
  if (diff !== 0) return diff

  const timeRemainingDS1 = ds1.executionTime - ds1.pausedAt
  const timeRemainingDS2 = ds2.executionTime - ds2.pausedAt

  return timeRemainingDS1 - timeRemainingDS2
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
