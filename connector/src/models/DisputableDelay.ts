import {
  Address,
  SubscriptionCallback,
  SubscriptionResult,
} from '../helpers/connect-types'
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

  async delayedScript(delayedExecutionId: string): Promise<DelayedScript> {
    return this.#connector.delayedScript(delayedExecutionId)
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
    return this.#connector.delayedScripts(this.#address, first, skip)
  }

  onDelayedScripts(
    { first = 1000, skip = 0 } = {},
    callback?: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionResult<DelayedScript[]> {
    return subscription<DelayedScript[]>(callback, (callback) =>
      this.#connector.onDelayedScripts(this.#address, first, skip, callback)
    )
  }
}
