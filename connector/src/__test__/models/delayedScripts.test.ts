import { connect } from '@aragon/connect'
import connectDisputableDelay, {
  ERC20,
  DelayedScript,
  DisputableDelay,
  CollateralRequirement
} from '../../../src'

const RINKEBY_NETWORK = 4
const ORGANIZATION_ADDRESS = '0xb85cd848cc26fb67f2bf38980b911cd56a9629fb'
const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-ddelay-rinkeby-staging'


describe('DisputableDelay', () => {
  let disputableDelay: DisputableDelay

  beforeAll(async () => {
    const organization = await connect(ORGANIZATION_ADDRESS, 'thegraph', { network: RINKEBY_NETWORK })
    const delayApp = await organization.app('disputable-delay')
    disputableDelay = await connectDisputableDelay(delayApp, ['thegraph', { subgraphUrl: DELAY_SUBGRAPH_URL} ])
  })

  afterAll(async () => {
    await disputableDelay.disconnect()
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

    test('can request the related token info', async () => {
      const token: ERC20 = await collateralRequirement.token()

      expect(token.id).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(token.name).toBe('DAI Token')
      expect(token.symbol).toBe('DAI')
      expect(token.decimals).toBe(18)
    })
  })

  describe('arbitrator fees', () => {
    let disputedDelayedScript: DelayedScript
    const delayedScriptId = `${DISPUTABLE_DELAY_ADDRESS}-delayedscript-3`

    beforeAll(async () => {
      disputedDelayedScript = await disputableDelay.delayedScript(delayedScriptId)
    })

    test('can request the submitter arbitrator fees', async () => {
      const artbiratorFee = (await disputedDelayedScript.submitterArbitratorFee())!

      expect(artbiratorFee.id).toBe(`${delayedScriptId}-submitter`)
      expect(artbiratorFee.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(artbiratorFee.formattedAmount).toBe('150.00')
    })

    test('can request the challenger arbitrator fees', async () => {
      const artbiratorFee = (await disputedDelayedScript.challengerArbitratorFee())!

      expect(artbiratorFee.id).toBe(`${delayedScriptId}-challenger`)
      expect(artbiratorFee.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(artbiratorFee.formattedAmount).toBe('150.00')
    })
  })
})
