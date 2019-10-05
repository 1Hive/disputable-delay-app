import React from 'react'
import styled from 'styled-components'
import { Card, Button, Countdown, CardLayout, textStyle, GU } from '@aragon/ui'

import LocalLabelAppBadge from './/LocalIdentityBadge/LocalLabelAppBadge'
import ScriptText from './ScriptText'

function Delays({ scripts, actions }) {
  return (
    <CardLayout columnWidthMin={30 * GU} rowHeight={294}>
      {scripts.map(
        (
          {
            scriptId,
            executionTime,
            executionDescription,
            executionTargetData,
            pausedAt,
            canExecute,
            ...script
          },
          index
        ) => {
          return (
            <CardItem
              key={index}
              css={`
                display: grid;
                grid-template-columns: 100%;
                grid-template-rows: auto 1fr auto auto;
                grid-gap: ${1 * GU}px;
                padding: ${3 * GU}px;
              `}
            >
              <div
                css={`
                  display: flex;
                  justify-content: space-between;
                  margin-bottom: ${1 * GU}px;
                `}
              >
                <LocalLabelAppBadge
                  badgeOnly
                  appAddress={executionTargetData.address}
                  iconSrc={executionTargetData.iconSrc}
                  identifier={executionTargetData.identifier}
                  label={executionTargetData.name}
                />
                {!canExecute && !pausedAt && (
                  <Countdown removeDaysAndHours={true} end={executionTime} />
                )}
              </div>
              <div
                css={`
                  ${textStyle('body1')};
                  /* lines per font size per line height */
                  /* shorter texts align to the top */
                  height: 84px;
                  display: -webkit-box;
                  -webkit-box-orient: vertical;
                  -webkit-line-clamp: 3;
                  overflow: hidden;
                `}
              >
                <span css="font-weight: bold;">#{scriptId}:</span>{' '}
                <ScriptText disabled text={executionDescription} />
              </div>
              <Options>
                {canExecute ? (
                  <Button
                    wide={true}
                    mode={'strong'}
                    onClick={() => actions.execute(scriptId)}
                  >
                    Execute
                  </Button>
                ) : (
                  <>
                    {!pausedAt ? (
                      <DelayButton
                        wide={true}
                        css={{ marginRight: '10px' }}
                        onClick={() => actions.pause(scriptId)}
                      >
                        Pause
                      </DelayButton>
                    ) : (
                      <DelayButton
                        wide={true}
                        css={{ marginRight: '10px' }}
                        onClick={() => actions.resume(scriptId)}
                      >
                        Resume
                      </DelayButton>
                    )}

                    <DelayButton
                      wide={true}
                      mode="negative"
                      onClick={() => actions.cancel(scriptId)}
                    >
                      Cancel
                    </DelayButton>
                  </>
                )}
              </Options>
            </CardItem>
          )
        }
      )}
    </CardLayout>
  )
}

const CardItem = styled(Card)`
  padding: 16px;
`

const Options = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
`

const DelayButton = styled(Button)`
  ${textStyle('body2')};
  width: 50%;
  &:first-child {
    margin-right: ${1 * GU}px;
  }
`

export default Delays
