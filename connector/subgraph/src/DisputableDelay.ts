import {BigInt, Address} from '@graphprotocol/graph-ts'
import {Agreement as AgreementContract} from '../generated/templates/Agreement/Agreement'
import {ERC20 as ERC20Contract} from '../generated/templates/DisputableDelay/ERC20'
import {
  DisputableDelay as DisputableDelayEntity,
  DelayedScript as DelayedScriptEntity,
  ERC20 as ERC20Entity,
} from '../generated/schema'
import {
  DisputableDelay as DelayContract,
  ExecutionDelaySet as ExecutionDelaySetEvent,
  DelayedScriptStored as DelayedScriptStoredEvent,
  ExecutionPaused as ExecutionPausedEvent,
  ExecutionResumed as ExecutionResumedEvent,
  ExecutionCancelled as ExecutionCancelledEvent,
  ExecutedScript as ExecutedScriptEvent
} from '../generated/templates/DisputableDelay/DisputableDelay'

/* eslint-disable @typescript-eslint/no-use-before-define */

export function handleExecutionDelaySet(event: ExecutionDelaySetEvent): void {
  const delayContract = DelayContract.bind(event.address)
  const delay = loadOrCreateDelay(event.address)!
  delay.delayedScriptsNewIndex = delayContract.delayedScriptsNewIndex()
  delay.save()
}

export function handleDelayedScriptStored(event: DelayedScriptStoredEvent): void {
  const disputableDelay = DisputableDelayEntity.load(event.address.toHexString())!

  const delayedScriptId = buildDelayedScriptId(event.address, event.params.delayedScriptId)
  const delayedScript = new DelayedScriptEntity(delayedScriptId)

  const delayContract = DelayContract.bind(event.address)
  const delayedScriptData = delayContract.delayedScripts(event.params.delayedScriptId)

  delayedScript.disputableDelay = event.address.toHexString()
  delayedScript.delayedScriptId = event.params.delayedScriptId
  delayedScript.executionFromTime = delayedScriptData.value0
  delayedScript.pausedAt = delayedScriptData.value1
  delayedScript.delayedScriptStatus = delayedScriptStatus(delayedScriptData.value2)
  delayedScript.evmScript = delayedScriptData.value3
  delayedScript.actionId = delayedScriptData.value4
  delayedScript.submitter = delayedScriptData.value5
  delayedScript.context = event.params.context
  delayedScript.disputeId = BigInt.fromI32(0)
  delayedScript.challengeId = BigInt.fromI32(0)
  delayedScript.challenger = Address.fromString('0x0000000000000000000000000000000000000000')
  delayedScript.challengeEndDate = BigInt.fromI32(0)
  delayedScript.settledAt = BigInt.fromI32(0)
  delayedScript.disputedAt = BigInt.fromI32(0)
  delayedScript.executedAt = BigInt.fromI32(0)
  delayedScript.collateralRequirement = disputableDelay.collateralRequirement
  delayedScript.save()

  disputableDelay.delayedScriptsNewIndex = delayContract.delayedScriptsNewIndex()
  disputableDelay.save()
}

export function handleExecutionPaused(event: ExecutionPausedEvent): void {
  const delayedScriptId = buildDelayedScriptId(event.address, event.params.delayedScriptId)
  const delayedScript = DelayedScriptEntity.load(delayedScriptId)!

  const delayContract = DelayContract.bind(event.address)
  const delayedScriptData = delayContract.delayedScripts(event.params.delayedScriptId)
  const agreementContract = AgreementContract.bind(delayContract.getAgreement())
  const challengeData = agreementContract.getChallenge(event.params.challengeId)

  delayedScript.pausedAt = delayedScriptData.value1
  delayedScript.delayedScriptStatus = delayedScriptStatus(delayedScriptData.value2)
  delayedScript.challenger = challengeData.value1
  delayedScript.challengeId = event.params.challengeId
  delayedScript.challengeEndDate = challengeData.value2
  delayedScript.save()
}

export function handleExecutionResumed(event: ExecutionResumedEvent): void {
  updateDelayedScript(event.address, event.params.delayedScriptId)
}

export function handleExecutionCancelled(event: ExecutionCancelledEvent): void {
  updateDelayedScript(event.address, event.params.delayedScriptId)
}

export function handleExecutedScript(event: ExecutedScriptEvent): void {
  updateDelayedScript(event.address, event.params.delayedScriptId)
}

export function updateDelayedScript(delayAddress: Address, delayedScriptId: BigInt): void {
  const delayedScriptIdSubgraph = buildDelayedScriptId(delayAddress, delayedScriptId)
  const delayedScript = DelayedScriptEntity.load(delayedScriptIdSubgraph)!

  const delayContract = DelayContract.bind(delayAddress)
  const delayedScriptData = delayContract.delayedScripts(delayedScriptId)

  delayedScript.executionFromTime = delayedScriptData.value0
  delayedScript.delayedScriptStatus = delayedScriptStatus(delayedScriptData.value2)
  delayedScript.save()
}

export function buildDelayedScriptId(delay: Address, delayedScriptId: BigInt): string {
  return delay.toHexString() + "-delayedscript-" + delayedScriptId.toString()
}

export function loadOrCreateDelay(delayAddress: Address): DisputableDelayEntity | null {
  let delay = DisputableDelayEntity.load(delayAddress.toHexString())
  if (!delay) {
    const delayContract = DelayContract.bind(delayAddress)

    // This unfortunate try catch section is necessary because the Agreement event that adds the CollateralRequirement to
    // the DisputableDelay entity can be processed before the DisputableDelay initialise (ExecutionDelaySet) event. Meaning we
    // must attempt to create a DisputableDelay entity before knowing if the disputable address passed to the Agreement event
    // is in fact of type DisputableDelay or a different disputable. If it is a different disputable the following calls will revert.
    const daoCall = delayContract.try_kernel()
    const agreementCall = delayContract.try_getAgreement()
    const executionDelayCall = delayContract.try_executionDelay()
    const delayedScriptsNewIndexCall = delayContract.try_delayedScriptsNewIndex()

    if (!daoCall.reverted && !agreementCall.reverted && !executionDelayCall.reverted && !delayedScriptsNewIndexCall.reverted) {
      delay = new DisputableDelayEntity(delayAddress.toHexString())
      delay.dao = daoCall.value
      delay.agreement = agreementCall.value
      delay.executionDelay = executionDelayCall.value
      delay.delayedScriptsNewIndex = delayedScriptsNewIndexCall.value
    }
  }
  return delay
}

export function buildERC20(address: Address): string {
  const id = address.toHexString()
  let token = ERC20Entity.load(id)

  if (token === null) {
    const tokenContract = ERC20Contract.bind(address)
    token = new ERC20Entity(id)
    token.name = tokenContract.name()
    token.symbol = tokenContract.symbol()
    token.decimals = tokenContract.decimals()
    token.save()
  }

  return token.id
}

function delayedScriptStatus(state: i32): string {
  switch (state) {
    case 0:
      return 'Active'
    case 1:
      return 'Challenged'
    case 2:
      return 'Cancelled'
    case 3:
      return 'Executed'
    default:
      return 'Unknown'
  }
}
