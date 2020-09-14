import {BigInt, Address} from '@graphprotocol/graph-ts'
import {buildDelayedScriptId, buildERC20, loadOrCreateDelay} from './DisputableDelay'
import {
  DisputableDelay as DisputableDelayEntity,
  DelayedScript as DelayedScriptEntity,
  ArbitratorFee as ArbitratorFeeEntity,
  CollateralRequirement as CollateralRequirementEntity
} from '../generated/schema'
import {
  Agreement as AgreementContract,
  CollateralRequirementChanged as CollateralRequirementChangedEvent,
  ActionDisputed as ActionDisputedEvent,
  ActionSettled as ActionSettledEvent,
  ActionChallenged as ActionChallengedEvent
} from '../generated/templates/Agreement/Agreement'

/* eslint-disable @typescript-eslint/no-use-before-define */

export function handleCollateralRequirementChanged(event: CollateralRequirementChangedEvent): void {
  const disputableDelay = loadOrCreateDelay(event.params.disputable)

  const agreementApp = AgreementContract.bind(event.address)
  const requirementId = buildCollateralRequirementId(event.params.disputable, event.params.collateralRequirementId)

  const requirement = new CollateralRequirementEntity(requirementId)
  const requirementData = agreementApp.getCollateralRequirement(event.params.disputable, event.params.collateralRequirementId)
  requirement.token = buildERC20(requirementData.value0)
  requirement.disputableDelay = event.params.disputable.toHexString()
  requirement.challengeDuration = requirementData.value1
  requirement.actionAmount = requirementData.value2
  requirement.challengeAmount = requirementData.value3
  requirement.collateralRequirementId = event.params.collateralRequirementId
  requirement.save()

  disputableDelay.collateralRequirement = requirementId
  disputableDelay.save()
}

export function handleActionDisputed(event: ActionDisputedEvent): void {
  const agreementApp = AgreementContract.bind(event.address)
  const actionData = agreementApp.getAction(event.params.actionId)
  const challengeData = agreementApp.getChallenge(event.params.challengeId)
  const delayedScriptId = buildDelayedScriptId(actionData.value0, actionData.value1)
  const delayedScript = DelayedScriptEntity.load(delayedScriptId)

  if (delayedScript) {
    delayedScript.delayedScriptStatus = 'Disputed'
    delayedScript.disputeId = challengeData.value8
    delayedScript.disputedAt = event.block.timestamp

    const submitterArbitratorFeeId = delayedScriptId + '-submitter'
    const challengeArbitratorFeesData = agreementApp.getChallengeArbitratorFees(event.params.challengeId)
    createArbitratorFee(delayedScriptId, submitterArbitratorFeeId, challengeArbitratorFeesData.value0, challengeArbitratorFeesData.value1)

    delayedScript.submitterArbitratorFee = submitterArbitratorFeeId
    delayedScript.save()
  }
}

export function handleActionSettled(event: ActionSettledEvent): void {
  const agreementApp = AgreementContract.bind(event.address)
  const actionData = agreementApp.getAction(event.params.actionId)
  const delayedScriptId = buildDelayedScriptId(actionData.value0, actionData.value1)
  const delayedScript = DelayedScriptEntity.load(delayedScriptId)

  if (delayedScript) {
    delayedScript.delayedScriptStatus = 'Settled'
    delayedScript.settledAt = event.block.timestamp
    delayedScript.save()
  }
}

export function handleActionChallenged(event: ActionChallengedEvent): void {
  const agreementApp = AgreementContract.bind(event.address)
  const actionData = agreementApp.getAction(event.params.actionId)
  const delayedScriptId = buildDelayedScriptId(actionData.value0, actionData.value1)

  const challengerArbitratorFeeId = delayedScriptId + '-challenger'
  const challengeArbitratorFeesData = agreementApp.getChallengeArbitratorFees(event.params.challengeId)
  createArbitratorFee(delayedScriptId, challengerArbitratorFeeId, challengeArbitratorFeesData.value2, challengeArbitratorFeesData.value3)

  const delayedScript = DelayedScriptEntity.load(delayedScriptId)
  if (delayedScript) {
    delayedScript.challengerArbitratorFee = challengerArbitratorFeeId
    delayedScript.save()
  }
}

function createArbitratorFee(delayedScriptId: string, id: string, feeToken: Address, feeAmount: BigInt): void {
  const arbitratorFee = new ArbitratorFeeEntity(id)
  arbitratorFee.delayedScript = delayedScriptId
  arbitratorFee.amount = feeAmount
  arbitratorFee.token = buildERC20(feeToken)
  arbitratorFee.save()
}

function buildCollateralRequirementId(disputable: Address, collateralRequirementId: BigInt): string {
  return disputable.toHexString() + "-collateral-" + collateralRequirementId.toString()
}
