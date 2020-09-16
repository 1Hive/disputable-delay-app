import { QueryResult } from '@aragon/connect-thegraph'

import CollateralRequirement from '../../models/CollateralRequirement'

function buildCollateralRequirement(collateralRequirement: any, connector: any): CollateralRequirement {
  const {
    id,
    disputableDelay,
    token,
    actionAmount,
    challengeAmount,
    challengeDuration,
    collateralRequirementId
  } = collateralRequirement

  const collateralRequirementData = {
    id,
    actionAmount,
    challengeAmount,
    challengeDuration,
    collateralRequirementId,
    disputableDelayId: disputableDelay.id,
    tokenId: token.id,
    tokenDecimals: token.decimals,
  }

  return new CollateralRequirement(collateralRequirementData, connector)
}

export function parseCollateralRequirement(
  result: QueryResult,
  connector: any
): CollateralRequirement {
  const collateralRequirement = result.data.collateralRequirement

  if (!collateralRequirement) {
    throw new Error('Unable to parse collateral requirement.')
  }

  return buildCollateralRequirement(collateralRequirement, connector)
}

export function parseCurrentCollateralRequirement(
  result: QueryResult,
  connector: any
): CollateralRequirement {
  const disputableDelay = result.data.disputableDelay

  if (!disputableDelay || !disputableDelay.collateralRequirement) {
    throw new Error('Unable to parse current collateral requirement.')
  }

  return buildCollateralRequirement(disputableDelay.collateralRequirement, connector)
}
