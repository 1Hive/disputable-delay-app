import React from 'react'
import { Bar, CardLayout, DropDown, GU, useLayout, useTheme, Tag, textStyle } from '@aragon/ui'

import STATUS from '../delay-status-types'
import DelayCard from '../components/DelayCard'
import EmptyFilteredDelays from '../components/EmptyFilteredDelays'

const useDelays = delays => {
  const ongoingDelays = delays.filter(delay => delay.status === STATUS.ONGOING)
  const pausedDelays = delays.filter(delay => delay.status === STATUS.PAUSED)
  const pendingDelays = delays.filter(delay => delay.status === STATUS.PENDING_EXECUTION)

  return { ongoingDelays, pausedDelays, pendingDelays }
}

const Delays = React.memo(
  ({
    delays,
    filteredDelays,
    delayStatusFilter,
    handleDelayStatusFilterChange,
    delayAppFilter,
    handleDelayAppFilterChange,
    handleClearFilters,
    executionTargets,
    selectDelay,
  }) => {
    const { layoutName } = useLayout()
    const theme = useTheme()
    const { ongoingDelays, pausedDelays, pendingDelays } = useDelays(filteredDelays)

    const multipleOfTarget = executionTargets.reduce((map, { name }) => {
      map.set(name, map.has(name))
      return map
    }, new Map())

    return (
      <React.Fragment>
        {layoutName !== 'small' && (
          <Bar>
            <div
              css={`
                height: ${8 * GU}px;
                display: grid;
                grid-template-columns: auto auto auto 1fr;
                grid-gap: ${1 * GU}px;
                align-items: center;
                padding-left: ${3 * GU}px;
              `}
            >
              <DropDown
                header="Status"
                placeholder="Status"
                selected={delayStatusFilter}
                onChange={handleDelayStatusFilterChange}
                items={[
                  <div>
                    All
                    <span
                      css={`
                        margin-left: ${1.5 * GU}px;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        color: ${theme.info};
                        ${textStyle('label3')};
                      `}
                    >
                      <Tag limitDigits={4} label={delays.length} size="small" />
                    </span>
                  </div>,
                  'Ongoing',
                  'Paused',
                  'Pending',
                ]}
                width="128px"
              />

              <DropDown
                header="App"
                placeholder="App"
                selected={delayAppFilter}
                onChange={handleDelayAppFilterChange}
                items={[
                  'All',
                  <ThisDelay showTag={multipleOfTarget.get('Delay')} />,
                  ...executionTargets.map(
                    ({ name, identifier }) =>
                      `${name}${multipleOfTarget.get(name) && identifier ? ` (${identifier})` : ''}`
                  ),
                  'External',
                ]}
                width="128px"
              />
            </div>
          </Bar>
        )}

        <React.Fragment>
          {!filteredDelays.length ? (
            <EmptyFilteredDelays onClear={handleClearFilters} />
          ) : (
            <DelayGroups
              ongoingDelays={ongoingDelays}
              pausedDelays={pausedDelays}
              pendingDelays={pendingDelays}
              selectDelay={selectDelay}
            />
          )}
        </React.Fragment>
      </React.Fragment>
    )
  }
)

const ThisDelay = ({ showTag }) => (
  <div
    css={`
      display: flex;
      align-items: center;
    `}
  >
    Delay
    {showTag && (
      <Tag
        size="small"
        css={`
          margin-left: ${1 * GU}px;
        `}
      >
        this app
      </Tag>
    )}
  </div>
)

const DelayGroups = ({ ongoingDelays, pausedDelays, pendingDelays, selectDelay }) => {
  const { layoutName } = useLayout()
  const compactMode = layoutName === 'small'
  const rowHeight = compactMode ? null : 240

  const groups = [
    ['Pending', pendingDelays],
    ['Ongoing', ongoingDelays],
    ['Paused', pausedDelays],
  ]

  return (
    <React.Fragment>
      {groups.map(([groupName, delays]) =>
        delays.length ? (
          <section key={groupName}>
            <GroupName title={groupName} count={delays.length} compactMode={compactMode} />
            <CardLayout columnWidthMin={30 * GU} rowHeight={rowHeight}>
              {delays.map(delay => {
                return <DelayCard key={delay.scriptId} delay={delay} selectDelay={selectDelay} />
              })}
            </CardLayout>
          </section>
        ) : null
      )}
    </React.Fragment>
  )
}

const GroupName = ({ title, count, compactMode }) => {
  const theme = useTheme()

  return (
    <h2
      css={`
        display: flex;
        align-items: center;
        margin-bottom: ${3 * GU}px;
        ${compactMode ? `padding: 0 ${2 * GU}px;` : ''}
      `}
    >
      <div
        css={`
          ${textStyle('body2')};
          color: ${theme.content};
        `}
      >
        {title}
      </div>
      <span
        css={`
          margin-left: ${1 * GU}px;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <Tag limitDigits={4} label={count} size="small" />
      </span>
    </h2>
  )
}

export default Delays
