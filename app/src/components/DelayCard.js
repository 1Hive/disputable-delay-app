import React, { useCallback } from 'react'
import styled from 'styled-components'

import { Card, textStyle, GU } from '@aragon/ui'

import LocalLabelAppBadge from '../components/LocalIdentityBadge/LocalLabelAppBadge'
import ScriptText from '../components/ScriptText'
import DelayStatus from '../components/DelayStatus'
import CustomProgressBar from './CustomProgressBar'

import STATUS from '../delay-status-types'

const DelayCard = React.memo(({ delay, selectDelay }) => {
  const {
    executionTargetData,
    status,
    timeSubmitted,
    totalTimePaused,
    executionTime,
    pausedAt,
  } = delay

  const handleSelectDelay = useCallback(
    delayId => {
      selectDelay(delayId)
    },
    [selectDelay]
  )

  return (
    <CardItem onClick={() => handleSelectDelay(delay.scriptId)}>
      <div>
        <LocalLabelAppBadge
          appAddress={executionTargetData.address}
          iconSrc={executionTargetData.iconSrc}
          identifier={executionTargetData.identifier}
          label={executionTargetData.name}
        />
      </div>
      <Description>
        <span css="font-weight: bold;">#{delay.scriptId}:</span>{' '}
        <ScriptText disabled={false} text={delay.executionDescription} />
      </Description>
      <div>
        {status === STATUS.PENDING_EXECUTION ? (
          <DelayStatus status={delay.status} />
        ) : (
          <CustomProgressBar
            start={timeSubmitted + totalTimePaused}
            endDate={executionTime}
            pausedAt={pausedAt}
          />
        )}
      </div>
    </CardItem>
  )
})

const CardItem = styled(Card)`
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: auto 1fr auto;
  grid-gap: ${1 * GU}px;
  padding: ${3 * GU}px;
  box-shadow: rgba(51, 77, 117, 0.2) 0px 1px 3px;
  border: 0;
  cursor: pointer;
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

export default DelayCard
