import React from 'react'
import styled from 'styled-components'
import { useAragonApi, useAppState } from '@aragon/api-react'
import { Main, Header, Button, SyncIndicator, SidePanel } from '@aragon/ui'

import { IdentityProvider } from './identity-manager'
import { AppLogicProvider, useAppLogic } from './hooks/app-logic'

import Delays from './components/Delays'
import Title from './components/Title'

const App = React.memo(function App() {
  const { delayedScripts, panelState, isSyncing, actions } = useAppLogic()

  // TODO: (Gabi) Add filter Scripts

  return (
    <React.Fragment>
      <SyncIndicator visible={isSyncing} />
      <Header primary={<Title text="Delay" />} />
      {delayedScripts && delayedScripts.length > 0 ? (
        <Delays scripts={delayedScripts} actions={actions} />
      ) : null}

      <SidePanel
        title="Withdraw"
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
