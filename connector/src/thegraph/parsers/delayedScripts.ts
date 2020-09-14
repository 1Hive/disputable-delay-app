import { QueryResult } from '@aragon/connect-thegraph'

import { DelayedScriptData } from '../../types'
import DelayedScript from "../../models/DelayedScript";

function buildDelayedScript(delayedScript: any, connector: any): DelayedScript {

  const {
    id,
    disputableDelay,
    delayedScriptId,
    executionFromTime,
    pausedAt,
    delayedScriptStatus,
    evmScript,
    actionId,
    submitter,
    context,
    disputeId,
    challengeId,
    challenger,
    challengeEndDate,
    settledAt,
    disputedAt,
    executedAt,
    collateralRequirement,
    submitterArbitratorFee,
    challengerArbitratorFee
  } = delayedScript

  const delayedScriptData: DelayedScriptData = {
    id,
    disputableDelayId: disputableDelay.id,
    delayedScriptId,
    executionFromTime,
    pausedAt,
    delayedScriptStatus,
    evmScript,
    actionId,
    submitter,
    context,
    disputeId,
    challengeId,
    challenger,
    challengeEndDate,
    settledAt,
    disputedAt,
    executedAt,
    collateralRequirementId: collateralRequirement.id,
    submitterArbitratorFeeId: submitterArbitratorFee ? submitterArbitratorFee.id : null,
    challengerArbitratorFeeId: challengerArbitratorFee ? challengerArbitratorFee.id : null
  }

  return new DelayedScript(delayedScriptData, connector)
}

export function parseDelayedScript(result: QueryResult, connector: any): DelayedScript {
  const delayedScript = result.data.delayedScript

  if (!delayedScript) {
    throw new Error('Unable to parse delayedScript.')
  }

  return buildDelayedScript(delayedScript, connector)
}

export function parseDelayedScripts(result: QueryResult, connector: any): DelayedScript[] {
  const delayedScripts = result.data.delayedScripts

  if (!delayedScripts) {
    throw new Error('Unable to parse delayedScripts.')
  }

  return delayedScripts.map((delayedScript: any) => buildDelayedScript(delayedScript, connector))
}
