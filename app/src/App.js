import React from 'react'
import { Main, Tag, Header, SyncIndicator, GU } from '@aragon/ui'

import { IdentityProvider } from './identity-manager'
import { AppLogicProvider, useAppLogic } from './hooks/app-logic'

import NoScripts from './screens/NoScripts'
import Delays from './components/Delays'
import Title from './components/Title'

const App = React.memo(() => {
  const { delayedScripts, executionDelayFormatted, isSyncing, onScriptAction } = useAppLogic()

  // TODO: (Gabi) Add filter Scripts

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
          <NoScripts isSyncing={isSyncing} />
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
          <Delays scripts={delayedScripts} onScriptAction={onScriptAction} />
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
