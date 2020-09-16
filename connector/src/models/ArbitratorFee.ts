import { SubscriptionHandler } from '../helpers/connect-types'

import ERC20 from './ERC20'
import { formatBn } from '../helpers'
import { ArbitratorFeeData, IDisputableDelayConnector } from '../types'

export default class ArbitratorFee {
  #connector: IDisputableDelayConnector

  readonly id: string
  readonly delayedScriptId: string
  readonly tokenId: string
  readonly tokenDecimals: string
  readonly amount: string

  constructor(
    data: ArbitratorFeeData,
    connector: IDisputableDelayConnector
  ) {
    this.#connector = connector

    this.id = data.id
    this.delayedScriptId = data.delayedScriptId
    this.tokenId = data.tokenId
    this.tokenDecimals = data.tokenDecimals
    this.amount = data.amount
  }

  get formattedAmount(): string {
    return formatBn(this.amount, this.tokenDecimals)
  }

  async token(): Promise<ERC20> {
    return this.#connector.ERC20(this.tokenId)
  }

  onToken(callback: Function): SubscriptionHandler {
    return this.#connector.onERC20(this.tokenId, callback)
  }
}
