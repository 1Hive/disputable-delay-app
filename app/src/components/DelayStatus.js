import React from 'react'
import { textStyle, useTheme } from '@aragon/ui'
import STATUS from '../delay-status-types'

const getStatusAttributes = (status, theme) => {
  if (status === STATUS.ONGOING) {
    return {
      label: 'Time remaining',
      color: null,
    }
  }
  if (status === STATUS.PAUSED) {
    return {
      label: 'Paused',
      color: theme.yellow,
    }
  }

  return {
    label: 'Pending execution',
    color: theme.positive,
  }
}

export default function DelayStatus({ status }) {
  const theme = useTheme()
  const { label, color } = getStatusAttributes(status, theme)
  return (
    <div>
      <span
        css={`
          ${textStyle('body2')};
          color: ${color};
        `}
      >
        <span>{label}</span>
      </span>
    </div>
  )
}
