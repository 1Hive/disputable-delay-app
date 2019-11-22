import { useState, useEffect, useCallback } from 'react'
import { useCurrentApp } from '@aragon/api-react'

import STATUS from '../delay-status-types'

const NULL_FILTER_STATE = -1
const STATUS_FILTER_ONGOING = 1
const STATUS_FILTER_PAUSED = 2
const STATUS_FILTER_PENDING = 3
const APP_FILTER_THIS = 1

function testStatusFilter(filter, scriptStatus) {
  return (
    filter === NULL_FILTER_STATE ||
    (filter === STATUS_FILTER_ONGOING && scriptStatus === STATUS.ONGOING) ||
    (filter === STATUS_FILTER_PAUSED && scriptStatus === STATUS.PAUSED) ||
    (filter === STATUS_FILTER_PENDING && scriptStatus === STATUS.PENDING_EXECUTION)
  )
}

function testAppFilter(filter, script, { apps, thisAddress }) {
  const { executionTargets } = script

  if (filter === NULL_FILTER_STATE) {
    return true
  }
  if (filter === APP_FILTER_THIS) {
    return executionTargets.length === 0 || executionTargets.includes(thisAddress)
  }

  // Filter order is all, this, ...apps, external so we sub 2 to adjust the index to the apps
  filter -= 2
  if (filter === apps.length) {
    // Only return true if there's a difference between the set of execution targets and apps
    const appsSet = new Set(apps.map(({ appAddress }) => appAddress))
    return executionTargets.filter(target => !appsSet.has(target)).length
  }

  return executionTargets.includes(apps[filter].appAddress)
}

const useFilterDelays = (delayedScripts, executionTargets) => {
  const { appAddress } = useCurrentApp() || {}

  const [filteredDelays, setFilteredScripts] = useState(delayedScripts)
  const [statusFilter, setStatusFilter] = useState(NULL_FILTER_STATE)
  // 0: All, 1: Delay (this), 2+: Execution targets, last: External
  const [appFilter, setAppFilter] = useState(NULL_FILTER_STATE)

  const handleClearFilters = useCallback(() => {
    setStatusFilter(NULL_FILTER_STATE)
    setAppFilter(NULL_FILTER_STATE)
  }, [setStatusFilter, setAppFilter])

  useEffect(() => {
    const filtered = delayedScripts.filter(script => {
      return (
        testStatusFilter(statusFilter, script.status) &&
        testAppFilter(appFilter, script, {
          apps: executionTargets,
          thisAddress: appAddress,
        })
      )
    })
    setFilteredScripts(filtered)
  }, [statusFilter, appFilter, appAddress, setFilteredScripts, delayedScripts, executionTargets])

  return {
    filteredDelays,
    delayStatusFilter: statusFilter,
    handleDelayStatusFilterChange: useCallback(
      index => {
        setStatusFilter(index || NULL_FILTER_STATE)
      },
      [setStatusFilter]
    ),
    delayAppFilter: appFilter,
    handleDelayAppFilterChange: useCallback(index => setAppFilter(index || NULL_FILTER_STATE), [
      setAppFilter,
    ]),
    handleClearFilters,
  }
}

export default useFilterDelays
