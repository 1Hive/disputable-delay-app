import React from 'react'
import styled from 'styled-components'

import { Button, GU, textStyle } from '@aragon/ui'

export default function DelayButton({ text, beforeIcon, css, ...props }) {
  return (
    <CustomButton wide css={css} {...props}>
      {beforeIcon && (
        <img
          src={beforeIcon}
          alt={text}
          width={14}
          css={`
            margin-right: 8px;
          `}
        />
      )}
      {text}
    </CustomButton>
  )
}

const CustomButton = styled(Button)`
  ${textStyle('body2')};
  width: 50%;
  &:first-child {
    margin-right: ${GU / 2}px;
  }
`
