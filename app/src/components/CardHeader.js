import React from 'react'
import styled from 'styled-components'

import CustomProgressBar from './CustomProgressBar'
import LocalLabelAppBadge from './/LocalIdentityBadge/LocalLabelAppBadge'

function CardHeader({ executionTargetData, timeSubmitted, executionTime, pausedAt, canExecute, totalTimePaused }) {
  return (
    <Wrapper>
      <LocalLabelAppBadge
        appAddress={executionTargetData.address}
        iconSrc={executionTargetData.iconSrc}
        identifier={executionTargetData.identifier}
        label={canExecute ? executionTargetData.name : ''}
      />
      {!canExecute && (
        <CustomProgressBar start={timeSubmitted + totalTimePaused} endDate={executionTime} pausedAt={pausedAt} />
      )}
    </Wrapper>
  )
}

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

export default CardHeader
