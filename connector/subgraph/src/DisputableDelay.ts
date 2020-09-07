import { BigInt, Address } from '@graphprotocol/graph-ts'
import { ERC20 as ERC20Contract } from '../generated/templates/DisputableVoting/ERC20'
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
    DelayedScriptStored as DelayedScriptStoredEvent
} from '../generated/templates/DisputableDelay/DisputableDelay'

export function handleExecutionDelaySet(event: ExecutionDelaySetEvent): void {
    const delayContract = DelayContract.bind(event.address)
    const executionDelay = delayContract.executionDelay()

    const delay = loadOrCreateDelay(event.address)
    delay.executiongDelay = executionDelay
    delay.save()
}

export function handleDelayedScriptStored(event: DelayedScriptStoredEvent): void {
    const delayedScriptId = buildDelayedScriptId(event.address, event.params.delayedScriptId)
    const delayContract = DelayContract.bind(event.address)

    const delayedScript = new DelayedScriptEntity(delayedScriptId)
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

    const agreementApp = AgreementContract.bind(delayContract.getAgreement())
    const actionData = agreementApp.getAction(delayedScript.actionId)
    const collateralRequirementData = agreementApp.getCollateralRequirement(event.address, actionData.value2)
    const collateralRequirement = new CollateralRequirementEntity(delayedScriptId)
    collateralRequirement.delayedScript = delayedScriptId
    collateralRequirement.token = buildERC20(collateralRequirementData.value0)
    collateralRequirement.challengeDuration = collateralRequirementData.value1
    collateralRequirement.actionAmount = collateralRequirementData.value2
    collateralRequirement.challengeAmount = collateralRequirementData.value3
    collateralRequirement.save()
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
        case 1: return 'Paused'
        case 2: return 'Cancelled'
        case 3: return 'Executed'
        default: return 'Unknown'
    }
}
