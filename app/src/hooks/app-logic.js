import React, { useCallback, useMemo } from 'react'
import { AragonApi, useAppState, useApi } from '@aragon/api-react'

import { useScripts } from './scripts-hooks'
import { formatTime } from '../lib/math-utils'
import appStateReducer from '../app-state-reducer'

function useScriptAction() {
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

  const [delayedScripts, executionTargets] = useScripts()

  return {
    delayedScripts,
    executionTargets,
    executionDelayFormatted,
    onScriptAction: useScriptAction(),
    isSyncing,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
