import { useMemo } from 'react'
import { useAppState, useCurrentApp, useInstalledApps } from '@aragon/api-react'

import { EMPTY_ADDRESS } from '../web3-utils'
import { getStatus } from '../lib/delay-utils'
import { useNow } from './utils-hooks'

// Temporary fix to make sure executionTargets always returns an array, until
// we find out the reason why it can sometimes be missing in the cached data.
function getScriptExecutionTargets(script) {
  return script.executionTargets || []
}

function useDecoratedDelays() {
  const { delayedScripts } = useAppState()
  const currentApp = useCurrentApp()
  const installedApps = useInstalledApps()

  return useMemo(() => {
    if (!delayedScripts) {
      return [[], []]
    }

    const decoratedScripts = delayedScripts.map((script, i) => {
      const executionTargets = getScriptExecutionTargets(script)

      let targetApp

      if (executionTargets.length > 1) {
        // If there's multiple targets, make a "multiple" version
        targetApp = {
          appAddress: EMPTY_ADDRESS,
          name: 'Multiple',
        }
      } else {
        // Otherwise, try to find the target from the installed apps
        const [targetAddress] = executionTargets

        targetApp = installedApps.find(app => app.appAddress === targetAddress)
        if (!targetApp) {
          targetApp = {
            appAddress: targetAddress,
            icon: () => null,
            name: 'External',
          }
        }
      }

      let executionTargetData = {}
      if (targetApp) {
        const { appAddress, icon, identifier, name } = targetApp
        executionTargetData = {
          address: appAddress,
          name,
          iconSrc: icon(24),
          identifier,
        }
      }

      return {
        ...script,
        executionTargetData,
      }
    })

    // Reduce the list of installed apps to just those that have been targetted by apps
    const executionTargets = installedApps
      .filter(app =>
        delayedScripts.some(script => getScriptExecutionTargets(script).includes(app.appAddress))
      )
      .map(({ appAddress, identifier, name }) => ({
        appAddress,
        identifier,
        name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return [decoratedScripts, executionTargets]
  }, [delayedScripts, currentApp, installedApps])
}

export function useDelays() {
  const [delayedScripts, executionTargets] = useDecoratedDelays()
  const now = useNow()

  const delayStatus = (delayedScripts || []).map(script => getStatus(script, now))
  const delayStatusKey = delayStatus.map(String).join('')

  return [
    useMemo(
      () =>
        (delayedScripts || []).map((script, index) => ({
          ...script,
          status: delayStatus[index],
        })),
      [delayedScripts, delayStatusKey]
    ),
    executionTargets,
  ]
}
