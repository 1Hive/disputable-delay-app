import { DisputableDelayData } from '../../types'
import { DisputableDelayConnectorTheGraph } from '../../../src'

const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-ddelay-rinkeby-staging'

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
        '0xb85cd848cc26fb67f2bf38980b911cd56a9629fb'
      )
      expect(disputableDelay.agreement).toBe('asdf')
      expect(disputableDelay.executionDelay).toBe(
        '1000'
      )
      expect(disputableDelay.delayedScriptsNewIndex).toBe(
        '2'
      )
    })
  })
})
