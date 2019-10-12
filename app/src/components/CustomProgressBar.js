import React, { useMemo } from 'react'
import styled from 'styled-components'

import { Countdown, ProgressBar, GU, useTheme } from '@aragon/ui'
import { round, toHours } from '../lib/math-utils'

function CustomProgressBar({ start, endDate, pausedAt }) {
  const theme = useTheme()
  const barColor = pausedAt ? theme.yellow : theme.accent

  const isActive = !pausedAt

  // If script execution is paused set now to time paused
  const now = !pausedAt ? Date.now() : pausedAt
  const end = endDate.getTime() // Get milliseconds

  const value = useMemo(() => {
    return round((now - start) / (end - start), 2)
  }, [start, now, end]) // Notice how if script is paused, the value is going to be the memoized one (not re-computed)

  return (
    <Wrapper cursor={isActive}>
      {isActive && (
        <Timer>
          <Countdown removeDaysAndHours={toHours(end - now) < 1} end={endDate} />
        </Timer>
      )}
      <ProgressBar value={value} animate={false} color={String(barColor)} />
    </Wrapper>
  )
}

export default CustomProgressBar

const Timer = styled.div`
  position: absolute;
  right: 0;
  top: 8px;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.4s ease;
`

const Wrapper = styled.div`
  width: 100%;
  margin-left: ${GU * 3}px;
  position: relative;
  padding: ${GU}px 0px;
  ${({ cursor }) => cursor && 'cursor: pointer;'}
  & > div > div {
    transition: transform 1s ease;
  }

  & > ${Timer} > time > span:first-child {
    height: 16px;
    width: 16px;
  }

  & > ${Timer} > time > span:nth-child(2) {
    font-size: 14px;
  }

  &:hover > ${Timer} {
    opacity: 1;
    transform: translateY(11px);
  }
`
