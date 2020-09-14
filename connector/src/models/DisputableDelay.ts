import { utils } from 'ethers'
import {
  Address,
  SubscriptionCallback,
  SubscriptionResult
} from '../helpers/connect-types'
import { subscription, App, ForwardingPath } from '@aragon/connect-core'
import { IDisputableDelayConnector } from '../types'
import DelayedScript from "./DelayedScript"
import CollateralRequirement from './CollateralRequirement'


export default class DisputableDelay {
  #app: App
  #connector: IDisputableDelayConnector

  readonly address: string

  constructor(connector: IDisputableDelayConnector, app: App) {
    this.#app = app
    this.#connector = connector

    this.address = app.address
  }

  async disconnect() {
    await this.#connector.disconnect()
  }

  async id(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.address)
    return data.id
  }

  async dao(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.address)
    return data.dao
  }

  async executionDelay(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.address)
    return data.executionDelay
  }

  async delayedScriptsNewIndex(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.address)
    return data.delayedScriptsNewIndex
  }

  async delayedScript(delayedScriptId: string): Promise<DelayedScript> {
    return this.#connector.delayedScript(delayedScriptId)
  }

  async agreement(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.address)
    return data.agreement
  }

  onDelayedScript(
    delayedExecutionId: string,
    callback?: SubscriptionCallback<DelayedScript>
  ): SubscriptionResult<DelayedScript> {
    return subscription<DelayedScript>(callback, (callback) =>
      this.#connector.onDelayedScript(delayedExecutionId, callback)
    )
  }

  async delayedScripts({ first = 1000, skip = 0 } = {}): Promise<DelayedScript[]> {
    return this.#connector.delayedScripts(this.address, first, skip)
  }

  onDelayedScripts(
    { first = 1000, skip = 0 } = {},
    callback?: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionResult<DelayedScript[]> {
    return subscription<DelayedScript[]>(callback, (callback) =>
      this.#connector.onDelayedScripts(this.address, first, skip, callback)
    )
  }

  async currentCollateralRequirement(): Promise<CollateralRequirement> {
    return this.#connector.currentCollateralRequirement(this.address)
  }

  onCurrentCollateralRequirement(
    callback?: SubscriptionCallback<CollateralRequirement>
  ): SubscriptionResult<CollateralRequirement> {
    return subscription<CollateralRequirement>(callback, (callback) =>
      this.#connector.onCurrentCollateralRequirement(this.address, callback)
    )
  }

  async delayExecution(script: string, context: string, signerAddress: string): Promise<ForwardingPath> {
    const intent = await this.#app.intent('delayExecution', [script, utils.toUtf8Bytes(context)], { actAs: signerAddress })

    // approve action collateral
    const agreement = await this.agreement()
    const { tokenId: collateralToken, actionAmount } = await this.currentCollateralRequirement()
    const preTransactions = await intent.buildApprovePreTransactions({ address: collateralToken, value: actionAmount, spender: agreement })

    intent.applyPreTransactions(preTransactions)
    return intent
  }
}
