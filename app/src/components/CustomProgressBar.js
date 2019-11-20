import React, { useMemo } from 'react'
import styled from 'styled-components'

import { Countdown, ProgressBar, GU, useTheme } from '@aragon/ui'
import { useNow } from '../hooks/utils-hooks'
import { round, toHours, formatTime } from '../lib/math-utils'

const ONE_SECOND = 1000

function CustomProgressBar({ start, endDate, pausedAt }) {
  const now = useNow()
  const theme = useTheme()
  const barColor = pausedAt ? theme.yellow : theme.accent

  const isActive = !pausedAt

  // If script execution is paused set moment to time paused
  const moment = !pausedAt ? now.getTime() : pausedAt
  const end = endDate.getTime() // Get milliseconds

  const value = useMemo(() => {
    return round((moment - start) / (end - start), 6)
  }, [start, moment, end]) // Notice how if script is paused, the value is going to be the memoized one (not re-computed)

  return (
    <Wrapper>
      <Timer>
        {isActive ? (
          <Countdown removeDaysAndHours={toHours(end - moment) < 1} end={endDate} />
        ) : (
          <span
            css={`
              font-size: 13px;
              color: ${String(theme.contentSecondary)};
            `}
          >{`${formatTime((end - pausedAt - ONE_SECOND) / ONE_SECOND)} remaining`}</span>
        )}
      </Timer>

      <ProgressBar value={value} animate={false} color={String(barColor)} />
    </Wrapper>
  )
}

export default CustomProgressBar

const Timer = styled.div`
  position: absolute;
  right: 0;
  top: 18px;
  opacity: 1;
  transition: opacity 0.3s ease, transform 0.4s ease;
`

const Wrapper = styled.div`
  width: 100%;
  margin-left: ${GU * 3}px;
  position: relative;
  padding: ${GU}px 0px;
  cursor: pointer;
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
`
