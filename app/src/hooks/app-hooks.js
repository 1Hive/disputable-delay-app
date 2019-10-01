import { useMemo, useCallback } from 'react'
import { useAppState, useApi } from '@aragon/api-react'

import { canExecute } from '../lib/script-utils'
import { useNow, useSidePanel } from './utils-hooks'

function useScripts() {
  const { delayedScripts } = useAppState()
  const now = useNow()

  const scriptStatus = (delayedScripts || []).map(script => canExecute(script.executionTime, now))
  const scriptStatusKey = scriptStatus.join('')

  return useMemo(
    () =>
      (delayedScripts || []).map((script, index) => ({
        ...script,
        canExecute: scriptStatus[index],
      })),
    [delayedScripts, scriptStatusKey]
  )
}

export function useScriptAction(onDone, action) {
  const api = useApi()

  return useCallback(
    scriptId => {
      api[`${action}Execution`](scriptId).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useExecuteAction(onDone) {
  const api = useApi()

  return useCallback(
    scriptId => {
      api.execute(scriptId).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useAppLogic() {
  const { isSyncing } = useAppState()

  const delayedScripts = useScripts()
  const panelState = useSidePanel()

  const actions = {
    execute: useExecuteAction(panelState.requestClose),
    pause: useScriptAction(panelState.requestClose),
    resume: useScriptAction(panelState.requestClose),
    cancel: useScriptAction(panelState.requestClose),
  }

  return {
    delayedScripts,
    panelState,
    isSyncing,
    actions,
  }
}
