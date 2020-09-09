import {
  SubscriptionCallback,
  SubscriptionHandler,
} from '../helpers/connect-types'
import { GraphQLWrapper, QueryResult } from '@aragon/connect-thegraph'

import {DisputableDelayData, IDisputableDelayConnector} from '../types'
import DelayedScript from "../models/DelayedScript";
import ERC20 from '../models/ERC20'
import ArbitratorFee from '../models/ArbitratorFee'
import CollateralRequirement from '../models/CollateralRequirement'
import * as queries from './queries'
import {
  parseDisputableDelay,
  parseERC20,
  parseDelayedScript,
  parseDelayedScripts,
  parseArbitratorFee,
  parseCollateralRequirement,
} from './parsers'

// TODO: Update subgraph URL's
export function subgraphUrlFromChainId(chainId: number) {
  if (chainId === 1) {
    return 'https://api.thegraph.com/subgraphs/name/aragon/aragon-dvoting-mainnet'
  }
  if (chainId === 4) {
    return 'https://api.thegraph.com/subgraphs/name/aragon/aragon-dvoting-rinkeby'
  }
  if (chainId === 100) {
    return 'https://api.thegraph.com/subgraphs/name/aragon/aragon-dvoting-xdai'
  }
  return null
}

type DisputableDelayConnectorTheGraphConfig = {
  pollInterval?: number
  subgraphUrl?: string
  verbose?: boolean
}

export default class DisputableDelayConnectorTheGraph
  implements IDisputableDelayConnector {
  #gql: GraphQLWrapper

  constructor(config: DisputableDelayConnectorTheGraphConfig) {
    if (!config.subgraphUrl) {
      throw new Error(
        'DisputableDelayConnectorTheGraph requires subgraphUrl to be passed.'
      )
    }
    this.#gql = new GraphQLWrapper(config.subgraphUrl, {
      pollInterval: config.pollInterval,
      verbose: config.verbose,
    })
  }

  async disconnect() {
    this.#gql.close()
  }

  async disputableDelay(
      disputableDelay: string
  ): Promise<DisputableDelayData> {
    return this.#gql.performQueryWithParser<DisputableDelayData>(
      queries.GET_DISPUTABLE_DELAY('query'),
      { disputableDelay },
      (result: QueryResult) => parseDisputableDelay(result)
    )
  }

  onDisputableDelay(
      disputableDelay: string,
      callback: SubscriptionCallback<DisputableDelayData>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<DisputableDelayData>(
      queries.GET_DISPUTABLE_DELAY('subscription'),
      { disputableDelay },
      callback,
      (result: QueryResult) => parseDisputableDelay(result)
    )
  }

  async delayedScript(delayedScriptId: string): Promise<DelayedScript> {
    return this.#gql.performQueryWithParser<DelayedScript>(
      queries.GET_DELAYED_SCRIPT('query'),
      { delayedScriptId },
      (result: QueryResult) => parseDelayedScript(result, this)
    )
  }

  onDelayedScript(
    delayedScriptId: string,
    callback: SubscriptionCallback<DelayedScript>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<DelayedScript>(
      queries.GET_DELAYED_SCRIPT('subscription'),
      { delayedScriptId },
      callback,
      (result: QueryResult) => parseDelayedScript(result, this)
    )
  }

  async delayedScripts(
    disputableDelay: string,
    first: number,
    skip: number
  ): Promise<DelayedScript[]> {
    return this.#gql.performQueryWithParser<DelayedScript[]>(
      queries.ALL_DELAYED_SCRIPTS('query'),
      { disputableDelay, first, skip },
      (result: QueryResult) => parseDelayedScripts(result, this)
    )
  }

  onDelayedScripts(
    disputableDelay: string,
    first: number,
    skip: number,
    callback: SubscriptionCallback<DelayedScript[]>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<DelayedScript[]>(
      queries.ALL_DELAYED_SCRIPTS('subscription'),
      { disputableDelay, first, skip },
      callback,
      (result: QueryResult) => parseDelayedScripts(result, this)
    )
  }

  async collateralRequirement(delayedScriptId: string): Promise<CollateralRequirement> {
    return this.#gql.performQueryWithParser<CollateralRequirement>(
      queries.GET_COLLATERAL_REQUIREMENT('query'),
      { delayedScriptId },
      (result: QueryResult) => parseCollateralRequirement(result, this)
    )
  }

  onCollateralRequirement(
    delayedScriptId: string,
    callback: SubscriptionCallback<CollateralRequirement>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<CollateralRequirement>(
      queries.GET_COLLATERAL_REQUIREMENT('subscription'),
      { delayedScriptId },
      callback,
      (result: QueryResult) => parseCollateralRequirement(result, this)
    )
  }

  async arbitratorFee(arbitratorFeeId: string): Promise<ArbitratorFee | null> {
    return this.#gql.performQueryWithParser<ArbitratorFee | null>(
      queries.GET_ARBITRATOR_FEE('query'),
      { arbitratorFeeId },
      (result: QueryResult) => parseArbitratorFee(result, this)
    )
  }

  onArbitratorFee(
    arbitratorFeeId: string,
    callback: SubscriptionCallback<ArbitratorFee | null>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<ArbitratorFee | null>(
      queries.GET_ARBITRATOR_FEE('subscription'),
      { arbitratorFeeId },
      callback,
      (result: QueryResult) => parseArbitratorFee(result, this)
    )
  }

  async ERC20(tokenAddress: string): Promise<ERC20> {
    return this.#gql.performQueryWithParser(
      queries.GET_ERC20('query'),
      { tokenAddress },
      (result: QueryResult) => parseERC20(result)
    )
  }

  onERC20(
    tokenAddress: string,
    callback: SubscriptionCallback<ERC20>
  ): SubscriptionHandler {
    return this.#gql.subscribeToQueryWithParser<ERC20>(
      queries.GET_ERC20('subscription'),
      { tokenAddress },
      callback,
      (result: QueryResult) => parseERC20(result)
    )
  }
}
