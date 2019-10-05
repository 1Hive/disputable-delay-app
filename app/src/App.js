import React from 'react'
import styled from 'styled-components'
import { useAragonApi, useAppState } from '@aragon/api-react'
import { Main, Header, Button, SyncIndicator, SidePanel, GU } from '@aragon/ui'

import { IdentityProvider } from './identity-manager'
import { AppLogicProvider, useAppLogic } from './hooks/app-logic'

import NoScripts from './screens/NoScripts'
import Delays from './components/Delays'
import Title from './components/Title'

const App = React.memo(function App() {
  const { delayedScripts, panelState, isSyncing, actions } = useAppLogic()

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
          <Header primary={<Title text="Delay" />} />
          <Delays scripts={delayedScripts} actions={actions} />
        </React.Fragment>
      )}
      <SidePanel
        opened={panelState.visible}
        onClose={panelState.requestClose}
        onTransitionEnd={panelState.endTransition}
      />
    </React.Fragment>
  )
})

export default function Delay() {
  return (
    <Main assetsUrl="./aragon-ui">
      <AppLogicProvider>
        <IdentityProvider>
          {/* <SettingsProvider> */}
          <App />
          {/* </SettingsProvider> */}
        </IdentityProvider>
      </AppLogicProvider>
    </Main>
  )
}
