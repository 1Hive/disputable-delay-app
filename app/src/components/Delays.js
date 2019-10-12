import React from 'react'
import styled from 'styled-components'
import { Card, CardLayout, textStyle, GU } from '@aragon/ui'

import CardHeader from './CardHeader'
import Options from './Options'
import ScriptText from './ScriptText'

function Delays({ scripts, actions }) {
  return (
    <CardLayout columnWidthMin={30 * GU} rowHeight={294}>
      {scripts.map((script, index) => {
        return (
          <CardItem key={index}>
            <CardHeader {...script} />
            <Description>
              <span css="font-weight: bold;">#{script.scriptId}:</span>{' '}
              <ScriptText disabled={false} text={script.executionDescription} />
            </Description>
            <Options
              scriptId={script.scriptId}
              canExecute={script.canExecute}
              pausedAt={script.pausedAt}
              actions={actions}
            />
          </CardItem>
        )
      })}
    </CardLayout>
  )
}

const CardItem = styled(Card)`
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: auto 1fr auto auto;
  grid-gap: ${1 * GU}px;
  padding: ${3 * GU}px;
  box-shadow: rgba(51, 77, 117, 0.2) 0px 1px 3px;
  border: 0;
`

const Description = styled.div`
  ${textStyle('body1')};
  /* lines per font size per line height */
  /* shorter texts align to the top */
  height: 84px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
`

export default Delays
