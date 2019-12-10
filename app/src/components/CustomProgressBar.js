import React, { useMemo } from 'react'
import styled from 'styled-components'

import { ProgressBar, GU, useTheme } from '@aragon/ui'
import { useNow } from '../hooks/utils-hooks'
import { round } from '../lib/math-utils'

function CustomProgressBar({ start, endDate, pausedAt }) {
  const now = useNow()
  const theme = useTheme()
  const barColor = pausedAt ? theme.yellow : theme.accent

  // If  delay is paused set moment to time paused
  const moment = !pausedAt ? now.getTime() : pausedAt
  const end = endDate.getTime() // Get milliseconds

  const value = useMemo(() => {
    return round((moment - start) / (end - start), 6)
  }, [start, moment, end]) // If delay is paused, the value is going to be the memoized one (not re-computed)

  return (
    <Wrapper>
      <ProgressBar value={value} animate={false} color={String(barColor)} />
    </Wrapper>
  )
}

export default CustomProgressBar

const Wrapper = styled.div`
  width: 100%;
  position: relative;
  padding: ${GU}px 0px;

  & > div > div {
    transition: transform 1.5s ease;
  }
`
