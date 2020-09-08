import {
  Address,
  SubscriptionCallback,
  SubscriptionResult,
} from '@aragon/connect-types'
import { subscription } from '@aragon/connect-core'
import { IDisputableDelayConnector } from '../types'
import DelayedScript from "./DelayedScript"

export default class DisputableDelay {
  #address: Address
  #connector: IDisputableDelayConnector

  constructor(connector: IDisputableDelayConnector, address: Address) {
    this.#connector = connector
    this.#address = address
  }

  async disconnect() {
    await this.#connector.disconnect()
  }

  async id(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.#address)
    return data.id
  }

  async dao(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.#address)
    return data.dao
  }

  async executionDelay(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.#address)
    return data.executionDelay
  }

  async delayedScriptsNewIndex(): Promise<string> {
    const data = await this.#connector.disputableDelay(this.#address)
    return data.delayedScriptsNewIndex
  }

  async delayedExecution(delayedExecutionId: string): Promise<DelayedScript> {
    return this.#connector.delayedExecution(delayedExecutionId)
  }

  onDelayedExecution(
    delayedExecutionId: string,
    callback?: SubscriptionCallback<DelayedScript>
  ): SubscriptionResult<DelayedScript> {
    return subscription<DelayedScript>(callback, (callback) =>
      this.#connector.onDelayedExecution(delayedExecutionId, callback)
    )
  }

  async delayedExecutions({ first = 1000, skip = 0 } = {}): Promise<DelayedScript[]> {
    return this.#connector.delayedExecutions(this.#address, first, skip)
  }

  onDelayedExecutions(
    { first = 1000, skip = 0 } = {},
    callback?: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionResult<DelayedScript[]> {
    return subscription<DelayedScript[]>(callback, (callback) =>
      this.#connector.onDelayedExecutions(this.#address, first, skip, callback)
    )
  }
}
