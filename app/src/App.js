import React from 'react'
import { useAragonApi, useAppState } from '@aragon/api-react'
import { Main, Header, Button, SyncIndicator, SidePanel } from '@aragon/ui'
import { useAppLogic } from './hooks/app-hooks'

import Delays from './components/Delays'
import Title from './components/Title'
import styled from 'styled-components'

function App() {
  const { delayedScripts, panelState, isSyncing, actions } = useAppLogic()
  return (
    <Main>
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
    </Main>
  )
}

export default App
