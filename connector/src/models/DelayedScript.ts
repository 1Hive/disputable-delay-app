import {
  SubscriptionCallback,
  SubscriptionResult,
} from '../helpers/connect-types'
import { subscription } from '@aragon/connect-core'
import { DelayedScriptData, IDisputableDelayConnector } from '../types'
import ArbitratorFee from './ArbitratorFee'
import CollateralRequirement from './CollateralRequirement'

export default class DelayedScript {
  #connector: IDisputableDelayConnector

  readonly id: string
  readonly disputableDelayId: string
  readonly delayedScriptId: string
  readonly executionFromTime: string
  readonly pausedAt: string
  readonly delayedScriptStatus: string
  readonly evmScript: string
  readonly actionId: string
  readonly submitter: string
  readonly context: string
  readonly disputeId: string
  readonly challengeId: string
  readonly challenger: string
  readonly challengeEndDate: string
  readonly settledAt: string
  readonly disputedAt: string
  readonly executedAt: string
  readonly submitterArbitratorFeeId: string
  readonly challengerArbitratorFeeId: string

  constructor(data: DelayedScriptData, connector: IDisputableDelayConnector) {
    this.#connector = connector

    this.id = data.id
    this.disputableDelayId = data.disputableDelayId
    this.delayedScriptId = data.delayedScriptId
    this.executionFromTime = data.executionFromTime
    this.pausedAt = data.pausedAt
    this.delayedScriptStatus = data.delayedScriptStatus
    this.evmScript = data.evmScript
    this.actionId = data.actionId
    this.submitter = data.submitter
    this.context = data.context
    this.disputeId = data.disputeId
    this.challengeId = data.challengeId
    this.challenger = data.challenger
    this.challengeEndDate = data.challengeEndDate
    this.settledAt = data.settledAt
    this.disputedAt = data.disputedAt
    this.executedAt = data.executedAt
    this.submitterArbitratorFeeId = data.submitterArbitratorFeeId
    this.challengerArbitratorFeeId = data.challengerArbitratorFeeId
  }

  async collateralRequirement(): Promise<CollateralRequirement> {
    return this.#connector.collateralRequirement(this.id)
  }

  onCollateralRequirement(
      callback?: SubscriptionCallback<CollateralRequirement>
  ): SubscriptionResult<CollateralRequirement> {
    return subscription<CollateralRequirement>(callback, (callback) =>
        this.#connector.onCollateralRequirement(this.id, callback)
    )
  }

  async submitterArbitratorFee(): Promise<ArbitratorFee | null> {
    return this.#connector.arbitratorFee(this.submitterArbitratorFeeId || '')
  }

  onSubmitterArbitratorFee(
      callback?: SubscriptionCallback<ArbitratorFee | null>
  ): SubscriptionResult<ArbitratorFee | null> {
    return subscription<ArbitratorFee | null>(callback, (callback) =>
        this.#connector.onArbitratorFee(this.submitterArbitratorFeeId || '', callback)
    )
  }

  async challengerArbitratorFee(): Promise<ArbitratorFee | null> {
    return this.#connector.arbitratorFee(this.challengerArbitratorFeeId || '')
  }

  onChallengerArbitratorFee(
      callback?: SubscriptionCallback<ArbitratorFee | null>
  ): SubscriptionResult<ArbitratorFee | null> {
    return subscription<ArbitratorFee | null>(callback, (callback) =>
        this.#connector.onArbitratorFee(this.challengerArbitratorFeeId || '', callback)
    )
  }
}
