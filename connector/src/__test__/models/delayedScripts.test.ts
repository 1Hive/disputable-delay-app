import { connect } from '@aragon/connect'

import {
  ERC20,
  DelayedScript,
  DisputableDelay,
  CollateralRequirement,
  DisputableDelayConnectorTheGraph,
} from '../../../src'

const RINKEBY_NETWORK = 4
const ORGANIZATION_ADDRESS = '0xb85cd848cc26fb67f2bf38980b911cd56a9629fb'
const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-disputable-delay-rinkeby'

describe('DisputableDelay', () => {
  let disputableDelay: DisputableDelay

  beforeAll(async () => {
    const organization = await connect(ORGANIZATION_ADDRESS, 'thegraph', { network: RINKEBY_NETWORK })
    const connector = new DisputableDelayConnectorTheGraph({ subgraphUrl: DELAY_SUBGRAPH_URL })
    const app = await organization.connection.orgConnector.appByAddress(organization, DISPUTABLE_DELAY_ADDRESS)
    disputableDelay = new DisputableDelay(connector, app)
  })

  afterAll(async () => {
    await disputableDelay.disconnect()
  })

  describe('end date', () => {
    let delayedScript: DelayedScript, settledDelayedScript: DelayedScript

    beforeEach(async () => {
      delayedScript = await disputableDelay.delayedScript(`${DISPUTABLE_DELAY_ADDRESS}-vote-0`)
      settledDelayedScript = await disputableDelay.delayedScript(`${DISPUTABLE_DELAY_ADDRESS}-vote-2`)
    })

    // describe('when it was not flipped', () => {
    //   test('computes the end date properly', async () => {
    //     const expectedScheduledVoteEndDate =
    //       parseInt(delayedScript.startDate) +
    //       parseInt(delayedScript.duration)
    //
    //     expect(delayedScript.endDate).toBe(expectedScheduledVoteEndDate.toString())
    //
    //     const expectedSettledVoteEndDate =
    //       parseInt(settledDelayedScript.startDate) +
    //       parseInt(settledDelayedScript.duration) +
    //       parseInt(settledDelayedScript.pauseDuration)
    //
    //     expect(settledDelayedScript.endDate).toBe(expectedSettledVoteEndDate.toString())
    //   })
    // })
    //
    // describe('when it was flipped', () => {
    //   beforeEach(async () => {
    //     Object.defineProperty(delayedScript, 'wasFlipped', { value: true })
    //     Object.defineProperty(settledDelayedScript, 'wasFlipped', { value: true })
    //   })
    //
    //   test('computes the end date properly', async () => {
    //     const expectedScheduledVoteEndDate =
    //       parseInt(delayedScript.startDate) +
    //       parseInt(delayedScript.duration) +
    //       parseInt(delayedScript.quietEndingExtension)
    //
    //     expect(delayedScript.endDate).toBe(expectedScheduledVoteEndDate.toString())
    //
    //     const expectedSettledVoteEndDate =
    //       parseInt(settledDelayedScript.startDate) +
    //       parseInt(settledDelayedScript.duration) +
    //       parseInt(settledDelayedScript.pauseDuration) +
    //       parseInt(settledDelayedScript.quietEndingExtension)
    //
    //     expect(settledDelayedScript.endDate).toBe(expectedSettledVoteEndDate.toString())
    //   })
    // })
  })

  describe('collateralRequirement', () => {
    const delayedScriptId = `${DISPUTABLE_DELAY_ADDRESS}-delayedscript-0`

    let collateralRequirement: CollateralRequirement

    beforeAll(async () => {
      const delayedScript = await disputableDelay.delayedScript(delayedScriptId)
      collateralRequirement = await delayedScript.collateralRequirement()
    })

    test('has a collateral requirement associated', async () => {
      expect(collateralRequirement.id).toBe(`${DISPUTABLE_DELAY_ADDRESS}-collateral-${collateralRequirement.collateralRequirementId}`)
      expect(collateralRequirement.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(collateralRequirement.actionAmount).toBe('0')
      expect(collateralRequirement.challengeAmount).toBe('0')
      expect(collateralRequirement.challengeDuration).toBe('259200')
    })

    test('can requests the related token info', async () => {
      const token: ERC20 = await collateralRequirement.token()

      expect(token.id).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(token.name).toBe('DAI Token')
      expect(token.symbol).toBe('DAI')
      expect(token.decimals).toBe(18)
    })
  })

  describe('arbitrator fees', () => {
    let delayedScript: DelayedScript
    const delayedScriptId = `${DISPUTABLE_DELAY_ADDRESS}-vote-13`

    beforeAll(async () => {
      delayedScript = await disputableDelay.delayedScript(delayedScriptId)
    })

    test('can requests the submitter arbitrator fees', async () => {
      const artbiratorFee = (await delayedScript.submitterArbitratorFee())!

      expect(artbiratorFee.id).toBe(`${delayedScriptId}-submitter`)
      expect(artbiratorFee.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(artbiratorFee.formattedAmount).toBe('150.00')
    })

    test('can requests the submitter arbitrator fees', async () => {
      const artbiratorFee = (await delayedScript.challengerArbitratorFee())!

      expect(artbiratorFee.id).toBe(`${delayedScriptId}-challenger`)
      expect(artbiratorFee.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(artbiratorFee.formattedAmount).toBe('150.00')
    })
  })
})
