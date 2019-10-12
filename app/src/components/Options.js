import React from 'react'
import styled from 'styled-components'

import { Button, GU, textStyle, useTheme } from '@aragon/ui'

const Options = React.memo(function Options({ scriptId, canExecute, pausedAt, actions }) {
  const { purple } = useTheme()
  return (
    <Wrapper>
      {canExecute ? (
        <DelayButton wide mode={'strong'} onClick={() => actions.execute(scriptId)}>
          Execute
        </DelayButton>
      ) : !pausedAt ? (
        <DelayButton
          wide
          css={`
            color: white;
            background-color: ${purple};
          `}
          onClick={() => actions.pause(scriptId)}
        >
          Pause
        </DelayButton>
      ) : (
        <DelayButton wide mode="positive" onClick={() => actions.resume(scriptId)}>
          Resume
        </DelayButton>
      )}
      <DelayButton wide onClick={() => actions.cancel(scriptId)}>
        Cancel
      </DelayButton>
    </Wrapper>
  )
})

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
`

const DelayButton = styled(Button)`
  ${textStyle('body2')};
  width: 50%;
  &:first-child {
    margin-right: ${GU / 2}px;
  }
`

export default Options
