import {
  SubscriptionCallback,
  SubscriptionHandler,
} from './helpers/connect-types'

import ERC20 from './models/ERC20'
import DelayedScript from './models/DelayedScript'
import ArbitratorFee from './models/ArbitratorFee'
import CollateralRequirement from './models/CollateralRequirement'

export interface DisputableDelayData {
  id: string
  dao: string
  agreement: string
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
  context: string
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
  disputableDelayId: string
  tokenId: string
  tokenDecimals: string
  actionAmount: string
  challengeAmount: string
  challengeDuration: string
  collateralRequirementId: string
}

export interface ArbitratorFeeData {
  id: string
  delayedScriptId: string
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
  delayedScript(delayedScriptId: string): Promise<DelayedScript>
  onDelayedScript(
    delayedScriptId: string,
    callback: SubscriptionCallback<DelayedScript>
  ): SubscriptionHandler
  delayedScripts(delayedScriptId: string, first: number, skip: number): Promise<DelayedScript[]>
  onDelayedScripts(
    delayedScriptId: string,
    first: number,
    skip: number,
    callback: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionHandler
  currentCollateralRequirement(disputableDelay: string): Promise<CollateralRequirement>
  onCurrentCollateralRequirement(
    disputableVoting: string,
    callback: SubscriptionCallback<CollateralRequirement>
  ): SubscriptionHandler
  collateralRequirement(delayedScriptId: string): Promise<CollateralRequirement>
  onCollateralRequirement(
    delayedScriptId: string,
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
