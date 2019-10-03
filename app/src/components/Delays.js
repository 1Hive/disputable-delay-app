import React from 'react'
import { Card, Button, Countdown, CardLayout, GU } from '@aragon/ui'
import styled from 'styled-components'

function Delays({ scripts, actions }) {
  return (
    <CardLayout columnWidthMin={30 * GU} rowHeight={294}>
      {scripts.map(
        (
          {
            scriptId,
            executionTime,
            executionDescription,
            pausedAt,
            canExecute,
          },
          index
        ) => {
          return (
            <CardItem key={index}>
              <span>{executionDescription}</span>
              {!pausedAt && (
                <Countdown removeDaysAndHours={true} end={executionTime} />
              )}
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
                      <Button
                        wide={true}
                        css={{ marginRight: '10px' }}
                        onClick={() => actions.pause(scriptId)}
                      >
                        Pause
                      </Button>
                    ) : (
                      <Button
                        wide={true}
                        css={{ marginRight: '10px' }}
                        onClick={() => actions.resume(scriptId)}
                      >
                        Resume
                      </Button>
                    )}

                    <Button
                      wide={true}
                      onClick={() => actions.cancel(scriptId)}
                    >
                      Cancel
                    </Button>
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

export default Delays
