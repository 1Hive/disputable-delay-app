import { ethers } from 'ethers'
import { connect } from '@aragon/connect'
import connectDisputableDelay, {
  ERC20,
  DisputableDelay,
  CollateralRequirement,
} from '../../../src'

const RINKEBY_NETWORK = 4
const ORGANIZATION_ADDRESS = '0xb85cd848cc26fb67f2bf38980b911cd56a9629fb'
const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-ddelay-rinkeby-staging'


describe.only('DisputableDelay', () => {
  let disputableDelay: DisputableDelay

  beforeAll(async () => {
    const organization = await connect(ORGANIZATION_ADDRESS, 'thegraph', { network: RINKEBY_NETWORK })
    const delayApp = await organization.app('disputable-delay')
    disputableDelay = await connectDisputableDelay(delayApp, ['thegraph', { subgraphUrl: DELAY_SUBGRAPH_URL} ])
  })

  afterAll(async () => {
    await disputableDelay.disconnect()
  })

  describe('current collateral requirement', () => {
    let collateralRequirement: CollateralRequirement

    beforeEach(async () => {
      collateralRequirement = await disputableDelay.currentCollateralRequirement()
    })

    test('has a collateral requirement associated', async () => {
      expect(collateralRequirement.id).toBe(`${DISPUTABLE_DELAY_ADDRESS}-collateral-${collateralRequirement.collateralRequirementId}`)
      expect(collateralRequirement.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(collateralRequirement.actionAmount).toBe('0')
      expect(collateralRequirement.formattedActionAmount).toBe('0.00')
      expect(collateralRequirement.challengeAmount).toBe('0')
      expect(collateralRequirement.formattedChallengeAmount).toBe('0.00')
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

  describe('delay execution', () => {
    const SCRIPT = '0x00000001'
    const CONTEXT = '0xABCD'
    const SIGNER_ADDRESS = '0x0090aed150056316e37fe6dfa10dc63e79d173b6'

    it('returns a new vote intent', async () => {
      const delayABI = new ethers.utils.Interface(['function delayExecution(bytes,bytes)'])
      const approveABI = new ethers.utils.Interface(['function approve(address,uint256)'])
      const intent = await disputableDelay.delayExecution(SCRIPT, CONTEXT, SIGNER_ADDRESS)
      const collateralRequirement = await disputableDelay.currentCollateralRequirement()

      expect(intent.transactions.length).toBe(2)

      const transaction1 = intent.transactions[0]
      expect(transaction1.to.toLowerCase()).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(transaction1.from).toBe(SIGNER_ADDRESS)
      expect(transaction1.data).toBe(approveABI.encodeFunctionData('approve', ['0x496083895042cf25ea838f6856cfd18cc8223ee7', collateralRequirement.actionAmount]))

      const transaction2 = intent.transactions[1]
      expect(transaction2.to.toLowerCase()).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(transaction2.from).toBe(SIGNER_ADDRESS)
      expect(transaction2.data).toBe(delayABI.encodeFunctionData('delayExecution', [SCRIPT, ethers.utils.toUtf8Bytes(CONTEXT)]))
    })
  })
})
