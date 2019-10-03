import { useMemo, useCallback } from 'react'
import { useAppState, useApi } from '@aragon/api-react'

import { canExecute } from '../lib/script-utils'
import { useNow, useSidePanel } from './utils-hooks'

function useScripts() {
  const { delayedScripts } = useAppState()
  const now = useNow()

  const scriptStatus = (delayedScripts || []).map(script =>
    canExecute(script, now)
  )
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

export function useScriptAction(action, onDone) {
  const api = useApi()

  return useCallback(
    scriptId => {
      api[`${action}Execution`](scriptId).toPromise()
      onDone()
    },
    [api, onDone]
  )
}

export function useExecuteAction() {
  const api = useApi()

  return useCallback(
    scriptId => {
      api.execute(scriptId).toPromise()
    },
    [api]
  )
}

export function useAppLogic() {
  const { isSyncing } = useAppState()

  const delayedScripts = useScripts()
  const panelState = useSidePanel()

  const actions = {
    pause: useScriptAction('pause', panelState.requestClose),
    resume: useScriptAction('resume', panelState.requestClose),
    cancel: useScriptAction('cancel', panelState.requestClose),
    execute: useExecuteAction(),
  }

  return {
    delayedScripts,
    panelState,
    isSyncing,
    actions,
  }
}
