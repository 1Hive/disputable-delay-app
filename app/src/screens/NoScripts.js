import React from 'react'
import { EmptyStateCard, GU, LoadingRing } from '@aragon/ui'

const NoScripts = React.memo(function NoScripts({ isSyncing }) {
  return (
    <EmptyStateCard
      text={
        isSyncing ? (
          <div
            css={`
              display: grid;
              align-items: center;
              justify-content: center;
              grid-template-columns: auto auto;
              grid-gap: ${1 * GU}px;
            `}
          >
            <LoadingRing />
            <span>Syncing…</span>
          </div>
        ) : (
          'No delayed actions!'
        )
      }
    />
  )
})

export default NoScripts
