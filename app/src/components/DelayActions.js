import React from 'react'
import { useTheme } from '@aragon/ui'

import DelayButton from './DelayButton'
import ResumeIcon from '../assets/resume.svg'
import PauseIcon from '../assets/pause.svg'

import STATUS from '../delay-status-types'

const getMainActionProps = (status, theme) => {
  switch (status) {
    case STATUS.ONGOING:
      return {
        mode: 'normal',
        mainAction: 'pause',
        label: 'Pause',
        beforeIcon: PauseIcon,
        css: `color: white; background-color: ${theme.purple};`,
      }
    case STATUS.PAUSED:
      return {
        mode: 'positive',
        mainAction: 'resume',
        label: 'Resume',
        beforeIcon: ResumeIcon,
      }
    default:
      return {
        mode: 'strong',
        mainAction: 'execute',
        label: 'Execute',
      }
  }
}

const DelayActions = React.memo(({ scriptId, status, onDelayAction }) => {
  const theme = useTheme()
  const props = getMainActionProps(status, theme)

  return (
    <div
      css={`
        width: 100%;
        display: flex;
        justify-content: space-around;
        margin-top: 16px;
      `}
    >
      <DelayButton {...props} onClick={() => onDelayAction(scriptId, props.mainAction)} />
      <DelayButton label="Cancel" onClick={() => onDelayAction(scriptId, 'cancel')} />
    </div>
  )
})

export default DelayActions
