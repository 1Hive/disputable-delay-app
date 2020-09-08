import { QueryResult } from '@aragon/connect-thegraph'

import {DisputableDelayData} from '../../types'

export function parseDisputableDelay(
  result: QueryResult
): DisputableDelayData {
  const disputableVoting = result.data.disputableDelay

  if (!disputableVoting) {
    throw new Error('Unable to parse disputable delay.')
  }

  return {
    id: disputableVoting.id,
    dao: disputableVoting.dao,
    executionDelay: disputableVoting.executionDelay,
    delayedScriptsNewIndex: disputableVoting.delayedScriptsNewIndex,
  }
}
