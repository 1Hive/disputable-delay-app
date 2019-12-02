import React from 'react'
import { Bar, Box, BackButton, Countdown, GU, Split, textStyle, useTheme } from '@aragon/ui'

import DelayActions from '../components/DelayActions'
import ScriptText from '../components/ScriptText'
import LocalLabelAppBadge from '../components/LocalIdentityBadge/LocalLabelAppBadge'
import DelayStatus from '../components/DelayStatus'

import STATUS from '../delay-status-types'
import { formatTime, toHours } from '../lib/math-utils'

const DelayDetail = React.memo(({ delay, onBack, onDelayAction }) => {
  const theme = useTheme()

  const { executionTargetData, executionDescription } = delay

  return (
    <React.Fragment>
      <Bar>
        <BackButton onClick={onBack} />
      </Bar>
      <Split
        primary={
          <Box>
            <LocalLabelAppBadge
              appAddress={executionTargetData.address}
              iconSrc={executionTargetData.iconSrc}
              identifier={executionTargetData.identifier}
              label={executionTargetData.name}
            />
            <section
              css={`
                display: grid;
                grid-template-columns: auto;
                grid-gap: ${2.5 * GU}px;
                margin-top: ${2.5 * GU}px;
              `}
            >
              <h1
                css={`
                  ${textStyle('title2')};
                `}
              >
                <span css="font-weight: bold;">Delay #{delay.scriptId}</span>
              </h1>
              <div>
                <h2
                  css={`
                    ${textStyle('label2')};
                    color: ${theme.surfaceContentSecondary};
                    margin-bottom: ${2 * GU}px;
                  `}
                >
                  Description
                </h2>
                <div
                  css={`
                    ${textStyle('body2')};
                  `}
                >
                  <ScriptText text={executionDescription} />
                </div>
              </div>
              <DelayActions
                scriptId={delay.scriptId}
                status={delay.status}
                onDelayAction={onDelayAction}
              />
            </section>
          </Box>
        }
        secondary={
          <Box heading="Status">
            <Status delay={delay} />
          </Box>
        }
      />
    </React.Fragment>
  )
})

function Status({ delay }) {
  const { status, executionTime, pausedAt } = delay
  const ONE_SECOND_IN_MS = 1000

  return (
    <div>
      <DelayStatus status={status} />
      <div
        css={`
          margin-top: 4px;
        `}
      >
        {status === STATUS.ONGOING && (
          <Countdown
            removeDaysAndHours={toHours(executionTime - new Date()) < 1}
            end={executionTime}
          />
        )}

        {status === STATUS.PAUSED && (
          <span
            css={`
              ${textStyle('body3')};
            `}
          >
            {`${formatTime(
              (executionTime - pausedAt - ONE_SECOND_IN_MS) / ONE_SECOND_IN_MS
            )} remaining`}
          </span>
        )}
      </div>
    </div>
  )
}

export default DelayDetail
