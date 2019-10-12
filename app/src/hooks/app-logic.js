import React, { useCallback, useMemo } from 'react'
import { AragonApi, useAppState, useApi } from '@aragon/api-react'

import { useScripts } from './scripts-hooks'
import { formatTime } from '../lib/math-utils'
import appStateReducer from '../app-state-reducer'

function useScriptAction(action) {
  const api = useApi()

  return useCallback(
    scriptId => {
      api[`${action}Execution`](scriptId).toPromise()
    },
    [api]
  )
}

function useExecuteAction() {
  const api = useApi()

  return useCallback(
    scriptId => {
      api.execute(scriptId).toPromise()
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

  const actions = {
    pause: useScriptAction('pause'),
    resume: useScriptAction('resume'),
    cancel: useScriptAction('cancel'),
    execute: useExecuteAction(),
  }

  return {
    delayedScripts,
    executionTargets,
    executionDelayFormatted,
    actions,
    isSyncing,
  }
}

export function AppLogicProvider({ children }) {
  return <AragonApi reducer={appStateReducer}>{children}</AragonApi>
}
