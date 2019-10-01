import React from 'react'
import { Card } from '@aragon/ui'

function Delays({ scripts }) {
  return (
    <div>
      {scripts.map((script, index) => {
        return (
          <Card key={index}>
            <div>{script.executionDescription}</div>
          </Card>
        )
      })}
    </div>
  )
}

export default Delays
