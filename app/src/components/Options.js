import React from 'react'
import styled from 'styled-components'

import { useTheme } from '@aragon/ui'
import DelayButton from './DelayButton'
import ResumeIcon from '../assets/resume.svg'
import PauseIcon from '../assets/pause.svg'

const getFirstActionProps = (action, theme) => {
  switch (action) {
    case 'resume':
      return { mode: 'positive', text: 'Resume', beforeIcon: ResumeIcon }
    case 'pause':
      return {
        mode: 'normal',
        css: `color: white; background-color: ${theme.purple};`,
        text: 'Pause',
        beforeIcon: PauseIcon,
      }
    default:
      return {
        mode: 'strong',
        text: 'Execute',
      }
  }
}

const Options = React.memo(({ scriptId, canExecute, pausedAt, onScriptAction }) => {
  const theme = useTheme()

  const action = canExecute ? 'execute' : pausedAt ? 'resume' : 'pause'
  const props = getFirstActionProps(action, theme)

  return (
    <Wrapper>
      <DelayButton {...props} onClick={() => onScriptAction(scriptId, action)} />
      <DelayButton text="Cancel" onClick={() => onScriptAction(scriptId, 'cancel')} />
    </Wrapper>
  )
})

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
`

export default Options
