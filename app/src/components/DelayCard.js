import React from 'react'
import styled from 'styled-components'
import { Card, GU, textStyle } from '@aragon/ui'

import CustomProgressBar from './CustomProgressBar'
import DelayDescription from './DelayDescription'
import DelayStatus from '../components/DelayStatus'
import LocalLabelAppBadge from '../components/LocalIdentityBadge/LocalLabelAppBadge'

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

  return (
    <CardItem onClick={() => selectDelay(delay.scriptId)}>
      <div>
        <LocalLabelAppBadge
          appAddress={executionTargetData.address}
          iconSrc={executionTargetData.iconSrc}
          identifier={executionTargetData.identifier}
          label={executionTargetData.name}
        />
      </div>
      <DelayDescription
        prefix={<span css="font-weight: bold">#{delay.scriptId}: </span>}
        description={delay.executionDescription}
        disabled
        css={`
          overflow: hidden;
          ${textStyle('body1')};
          line-height: ${27}px; // 27px = line-height of textstyle('body1')
          height: ${27 * 3}px; // 27px * 3 = line-height * 3 lines
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 3;
        `}
      />
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

export default DelayCard
