import React, { useCallback, useMemo } from 'react'
import { AragonApi, useApi, useAppState, useGuiStyle, usePath } from '@aragon/api-react'

import { useDelays } from './delay-hooks'
import { formatTime } from '../lib/math-utils'
import appStateReducer from '../app-state-reducer'

const DELAY_ID_PATH_RE = /^\/delay\/([0-9]+)\/?$/
const NO_DELAY_ID = '-1'

function delayIdFromPath(path) {
  if (!path) {
    return NO_DELAY_ID
  }
  const matches = path.match(DELAY_ID_PATH_RE)
  return matches ? matches[1] : NO_DELAY_ID
}

export function useSelectedDelay(delayedScripts) {
  const [path, requestPath] = usePath()

  const { ready } = useAppState()

  // The memoized delayed script currently selected.
  const selectedScript = useMemo(() => {
    const selectedScriptId = delayIdFromPath(path)
    // The `ready` check prevents a delayed script to be selected
    // until the app state is fully ready.
    if (!ready || selectedScriptId === NO_DELAY_ID) {
      return null
    }
    return delayedScripts.find(script => script.scriptId === selectedScriptId) || null
  }, [path, delayedScripts, ready])

  const selectDelay = useCallback(
    delayId => {
      requestPath(String(delayId) === NO_DELAY_ID ? '' : `/delay/${delayId}/`)
    },
    [requestPath]
  )

  return [selectedScript, selectDelay]
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
