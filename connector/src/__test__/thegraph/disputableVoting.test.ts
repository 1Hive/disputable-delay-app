import { DisputableDelayData } from '../../types'
import { DisputableDelayConnectorTheGraph } from '../../../src'

const DISPUTABLE_DELAY_ADDRESS = '0xfd59F7557FA408Ea125f8b07E7d3747BA477f8d4'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-disputable-delay-rinkeby'

describe('DisputableVoting', () => {
  let connector: DisputableDelayConnectorTheGraph

  beforeAll(() => {
    connector = new DisputableDelayConnectorTheGraph({
      subgraphUrl: DELAY_SUBGRAPH_URL,
    })
  })

  afterAll(async () => {
    await connector.disconnect()
  })

  describe('data', () => {
    let disputableVoting: DisputableDelayData

    beforeAll(async () => {
      disputableVoting = await connector.disputableDelay(DISPUTABLE_DELAY_ADDRESS)
    })

    test('returns the disputable voting data', () => {
      expect(disputableVoting.id).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(disputableVoting.dao).toBe(
        '0xcd4016b1482a99929beaa6c1a004235ea12b8732'
      )
      expect(disputableVoting.executionDelay).toBe(
        '1000'
      )
      expect(disputableVoting.delayedScriptsNewIndex).toBe(
        '3'
      )
    })
  })
})
