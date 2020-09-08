import {
  SubscriptionCallback,
  SubscriptionHandler,
} from '@aragon/connect-types'

import ERC20 from './models/ERC20'
import DelayedScript from './models/DelayedScript'
import ArbitratorFee from './models/ArbitratorFee'
import CollateralRequirement from './models/CollateralRequirement'

export interface DisputableDelayData {
  id: string
  dao: string
  executionDelay: string
  delayedScriptsNewIndex: string
}

export interface DelayedScriptData {
  id: string
  disputableDelayId: string
  delayedScriptId: string
  executionFromTime: string
  pausedAt: string
  delayedScriptStatus: string
  evmScript: string
  actionId: string
  submitter: string
  disputeId: string
  challengeId: string
  challenger: string
  challengeEndDate: string
  settledAt: string
  disputedAt: string
  executedAt: string
  submitterArbitratorFeeId: string
  challengerArbitratorFeeId: string
}

export interface CollateralRequirementData {
  id: string
  voteId: string
  tokenId: string
  tokenDecimals: string
  actionAmount: string
  challengeAmount: string
  challengeDuration: string
}

export interface ArbitratorFeeData {
  id: string
  voteId: string
  tokenId: string
  tokenDecimals: string
  amount: string
}

export interface ERC20Data {
  id: string
  name: string
  symbol: string
  decimals: string
}

export interface IDisputableDelayConnector {
  disconnect(): Promise<void>
  disputableDelay(disputableDelay: string): Promise<DisputableDelayData>
  onDisputableDelay(
    disputableDelay: string,
    callback: SubscriptionCallback<DisputableDelayData>
  ): SubscriptionHandler
  delayedExecution(delayedScriptId: string): Promise<DelayedScript>
  onDelayedExecution(
    delayedScriptId: string,
    callback: SubscriptionCallback<DelayedScript>
  ): SubscriptionHandler
  delayedExecutions(delayedScriptId: string, first: number, skip: number): Promise<DelayedScript[]>
  onDelayedExecutions(
    delayedScriptId: string,
    first: number,
    skip: number,
    callback: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionHandler
  collateralRequirement(voteId: string): Promise<CollateralRequirement>
  onCollateralRequirement(
    voteId: string,
    callback: SubscriptionCallback<CollateralRequirement>
  ): SubscriptionHandler
  arbitratorFee(arbitratorFeeId: string): Promise<ArbitratorFee | null>
  onArbitratorFee(
    arbitratorFeeId: string,
    callback: SubscriptionCallback<ArbitratorFee | null>
  ): SubscriptionHandler
  ERC20(tokenAddress: string): Promise<ERC20>
  onERC20(tokenAddress: string, callback: Function): SubscriptionHandler
}
