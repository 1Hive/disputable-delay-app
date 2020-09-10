import { QueryResult } from '@aragon/connect-thegraph'

import {DisputableDelayData} from '../../types'

export function parseDisputableDelay(
  result: QueryResult
): DisputableDelayData {
  const disputableDelay = result.data.disputableDelay

  if (!disputableDelay) {
    throw new Error('Unable to parse disputable delay.')
  }

  return {
    id: disputableDelay.id,
    dao: disputableDelay.dao,
    executionDelay: disputableDelay.executionDelay,
    delayedScriptsNewIndex: disputableDelay.delayedScriptsNewIndex,
  }
}
