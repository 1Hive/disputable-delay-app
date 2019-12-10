import React, { useCallback } from 'react'
import { Main, Tag, Header, SyncIndicator, GU } from '@aragon/ui'

import { IdentityProvider } from './identity-manager'
import { AppLogicProvider, useAppLogic } from './hooks/app-logic'
import useFilterDelays from './hooks/useFilterDelays'

import Title from './components/Title'
import NoDelays from './screens/NoDelays'
import DelayDetail from './screens/DelayDetail'
import Delays from './screens/Delays'

const App = React.memo(() => {
  const {
    delayedScripts,
    executionTargets,
    executionDelayFormatted,
    onDelayAction,
    selectDelay,
    selectedDelay,
    isSyncing,
  } = useAppLogic()

  const {
    filteredDelays,
    delayStatusFilter,
    handleDelayStatusFilterChange,
    delayAppFilter,
    handleDelayAppFilterChange,
    handleClearFilters,
  } = useFilterDelays(delayedScripts, executionTargets)

  const handleBack = useCallback(() => {
    selectDelay(-1)
  }, [selectDelay])

  return (
    <React.Fragment>
      <SyncIndicator visible={isSyncing} />
      {!delayedScripts.length && (
        <div
          css={`
            height: calc(100vh - ${8 * GU}px);
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <NoDelays isSyncing={isSyncing} />
        </div>
      )}
      {!!delayedScripts.length && (
        <React.Fragment>
          <Header
            primary={
              <Title
                text="Delay"
                after={
                  executionDelayFormatted && (
                    <Tag mode="identifier" uppercase={false}>
                      {executionDelayFormatted}
                    </Tag>
                  )
                }
              />
            }
          />
          {selectedDelay ? (
            <DelayDetail delay={selectedDelay} onBack={handleBack} onDelayAction={onDelayAction} />
          ) : (
            <Delays
              delays={delayedScripts}
              filteredDelays={filteredDelays}
              delayStatusFilter={delayStatusFilter}
              handleDelayStatusFilterChange={handleDelayStatusFilterChange}
              delayAppFilter={delayAppFilter}
              handleDelayAppFilterChange={handleDelayAppFilterChange}
              handleClearFilters={handleClearFilters}
              executionTargets={executionTargets}
              selectDelay={selectDelay}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  )
})

export default function Delay() {
  return (
    <Main assetsUrl="./aragon-ui">
      <AppLogicProvider>
        <IdentityProvider>
          <App />
        </IdentityProvider>
      </AppLogicProvider>
    </Main>
  )
}
