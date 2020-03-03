import React, { useCallback, useMemo, useState } from 'react'
import { AragonApi, useApi, useAppState, useGuiStyle } from '@aragon/api-react'

import { useDelays } from './delay-hooks'
import { formatTime } from '../lib/math-utils'
import appStateReducer from '../app-state-reducer'

export function useSelectedDelay(delayedScripts) {
  const [selectedScriptId, setSelectedScriptId] = useState('-1')
  const { ready } = useAppState()

  // The memoized delayed script currently selected.
  const selectedScript = useMemo(() => {
    // The `ready` check prevents a delayed script to be selected
    // until the app state is fully ready.
    if (!ready || selectedScriptId === '-1') {
      return null
    }
    return delayedScripts.find(script => script.scriptId === selectedScriptId) || null
  }, [selectedScriptId, delayedScripts, ready])

  return [
    selectedScript,

    // setSelectedScriptId() is exported directly: since `selectedScriptId` is
    // set in the `selectedScript` dependencies, it means that the useMemo()
    // will be updated every time `selectedScriptId` changes.
    setSelectedScriptId,
  ]
}

function useDelayedScriptAction() {
  const api = useApi()
  const defaultAction = 'execute'

  return useCallback(
    (scriptId, action = defaultAction) => {
      const method = action !== defaultAction ? `${action}Execution` : action
      api[method](scriptId).toPromise()
    },
    [api]
  )
}

export function useAppLogic() {
  const { isSyncing, executionDelay } = useAppState()

  const executionDelayFormatted = useMemo(() => {
    return formatTime(executionDelay)
  }, [executionDelay])

  const [delayedScripts, executionTargets] = useDelays()
  const [selectedDelay, selectDelay] = useSelectedDelay(delayedScripts)

  return {
    delayedScripts,
    executionTargets,
    executionDelayFormatted,
    onDelayAction: useDelayedScriptAction(),
    selectDelay,
    selectedDelay,
    isSyncing,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}

export { useGuiStyle }
