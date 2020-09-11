import { DisputableDelayData } from '../../types'
import { DisputableDelayConnectorTheGraph } from '../../../src'

const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-disputable-delay-rinkeby'

describe.only('DisputableDelay', () => {
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
    let disputableDelay: DisputableDelayData

    beforeAll(async () => {
      disputableDelay = await connector.disputableDelay(DISPUTABLE_DELAY_ADDRESS)
    })

    test('returns the disputable delay data', () => {
      expect(disputableDelay.id).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(disputableDelay.dao).toBe(
        '0xcd4016b1482a99929beaa6c1a004235ea12b8732'
      )
      expect(disputableDelay.executionDelay).toBe(
        '1000'
      )
      expect(disputableDelay.delayedScriptsNewIndex).toBe(
        '3'
      )
    })
  })
})
