import { DisputableDelayConnectorTheGraph, DelayedScript } from '../../../src'

const DISPUTABLE_DELAY_ADDRESS = '0x88453B60b4717B762f9499F991eedd37296eFBa8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-disputable-delay-rinkeby'

describe('DisputableDelay votes', () => {
  let connector: DisputableDelayConnectorTheGraph

  beforeAll(() => {
    connector = new DisputableDelayConnectorTheGraph({
      subgraphUrl: DELAY_SUBGRAPH_URL,
    })
  })

  afterAll(async () => {
    await connector.disconnect()
  })

  describe('vote', () => {
    test('returns the requested vote information', async () => {
      const delayedScript: DelayedScript = await connector.delayedScript(`${DISPUTABLE_DELAY_ADDRESS}-delayedscript-0`)

      expect(delayedScript.id).toBe(`${DISPUTABLE_DELAY_ADDRESS}-delayedscript-0`)
      expect(delayedScript.disputableDelayId).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(delayedScript.delayedScriptId).toEqual('0')
      expect(delayedScript.executionFromTime).toBe('1599823571')
      expect(delayedScript.pausedAt).toBe('0')
      expect(delayedScript.delayedScriptStatus).toBe('Executed')
      expect(delayedScript.evmScript).toBe('0x00000001')
      expect(delayedScript.actionId).toBe('1')
      expect(delayedScript.submitter).toBe('0xFF3B8aaD3DBFaF7FFEA00a96e33aa18952b4f9B7')
      expect(delayedScript.context).toBe('0xABCD')
      // expect(delayedScript.disputeId).toBe('0')
      // expect(delayedScript.challengeId).toBe('0')
      // expect(delayedScript.challenger).toBe('')
      // expect(delayedScript.challengeEndDate).toBe(
      // expect(delayedScript.settledAt).toBe(
      // expect(delayedScript.disputedAt).toBe(
      // expect(delayedScript.executedAt).toBe(
      // expect(delayedScript.submitterArbitratorFeeId).toBe(
      // expect(delayedScript.challengerArbitratorFeeId).toBe(
    })
  })

  describe('votes', () => {
    let votes: DelayedScript[]

    beforeAll(async () => {
      votes = await connector.delayedScripts(DISPUTABLE_DELAY_ADDRESS, 1000, 0)
    })

    test('returns a list of votes', () => {
      expect(votes.length).toBeGreaterThan(1)
    })

    test('allows fetching a single vote', () => {
      const delayedScript = votes[1]

      expect(delayedScript.id).toBe(`${DISPUTABLE_DELAY_ADDRESS}-delayedscript-1`)
      expect(delayedScript.disputableDelayId).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(delayedScript.delayedScriptId).toEqual('1')
      expect(delayedScript.executionFromTime).toBe('1599826271')
      expect(delayedScript.pausedAt).toBe('1599825376')
      expect(delayedScript.delayedScriptStatus).toBe('Cancelled')
      expect(delayedScript.evmScript).toBe('0x00000001')
      expect(delayedScript.actionId).toBe('2')
      expect(delayedScript.submitter).toBe('0xFF3B8aaD3DBFaF7FFEA00a96e33aa18952b4f9B7')
      expect(delayedScript.context).toBe('0xABCD')
    })
  })
})
