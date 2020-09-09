import { BigInt, Address } from '@graphprotocol/graph-ts'
import { ERC20 as ERC20Contract } from '../generated/templates/DisputableDelay/ERC20'
import { Agreement as AgreementContract } from '../generated/templates/Agreement/Agreement'
import {
    DisputableDelay as DisputableDelayEntity,
    DelayedScript as DelayedScriptEntity,
    ERC20 as ERC20Entity,
    CollateralRequirement as CollateralRequirementEntity
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
    const executionDelay = delayContract.executionDelay()

    const delay = loadOrCreateDelay(event.address)
    delay.executionDelay = executionDelay
    delay.save()
}

export function handleDelayedScriptStored(event: DelayedScriptStoredEvent): void {
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
    delayedScript.challengeId = BigInt.fromI32(0)
    delayedScript.challenger = Address.fromString('0x0000000000000000000000000000000000000000')
    delayedScript.challengeEndDate = BigInt.fromI32(0)
    delayedScript.settledAt = BigInt.fromI32(0)
    delayedScript.disputedAt = BigInt.fromI32(0)
    delayedScript.executedAt = BigInt.fromI32(0)
    delayedScript.save()

    const agreementContract = AgreementContract.bind(delayContract.getAgreement())
    const actionData = agreementContract.getAction(delayedScript.actionId)
    const collateralRequirementData = agreementContract.getCollateralRequirement(event.address, actionData.value2)
    const collateralRequirement = new CollateralRequirementEntity(delayedScriptId)

    collateralRequirement.delayedScript = delayedScriptId
    collateralRequirement.token = buildERC20(collateralRequirementData.value0)
    collateralRequirement.challengeDuration = collateralRequirementData.value1
    collateralRequirement.actionAmount = collateralRequirementData.value2
    collateralRequirement.challengeAmount = collateralRequirementData.value3
    collateralRequirement.save()
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
    return delay.toHexString() + "-vote-" + delayedScriptId.toString()
}

function loadOrCreateDelay(delayAddress: Address): DisputableDelayEntity {
    let delay = DisputableDelayEntity.load(delayAddress.toHexString())
    if (!delay) {
        const delayContract = DelayContract.bind(delayAddress)
        delay = new DisputableDelayEntity(delayAddress.toHexString())
        delay.dao = delayContract.kernel()
    }
    return delay!
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
        case 0: return 'Active'
        case 1: return 'Challenged'
        case 2: return 'Cancelled'
        case 3: return 'Executed'
        default: return 'Unknown'
    }
}
