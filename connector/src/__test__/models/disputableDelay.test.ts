import { ethers } from 'ethers'
import { connect } from '@aragon/connect'

import {
  ERC20,
  DisputableDelay,
  CollateralRequirement,
  DisputableDelayConnectorTheGraph,
} from '../../../src'
import {
  DisputableVoting,
  DisputableVotingConnectorTheGraph
} from "../../../../../../Aragon-Repos/connect/packages/connect-disputable-voting/src";


const RINKEBY_NETWORK = 4
const ORGANIZATION_ADDRESS = '0xb85cd848cc26fb67f2bf38980b911cd56a9629fb'
const DISPUTABLE_DELAY_ADDRESS = '0x88453b60b4717b762f9499f991eedd37296efba8'
const DELAY_SUBGRAPH_URL =
  'https://api.thegraph.com/subgraphs/name/1hive/aragon-disputable-delay-rinkeby'


describe('DisputableVoting', () => {
  let disputableDelay: DisputableDelay

  beforeAll(async () => {
    const organization = await connect(ORGANIZATION_ADDRESS, 'thegraph', { network: RINKEBY_NETWORK })
    console.log("ORG", organization)

    const connector = new DisputableDelayConnectorTheGraph({ subgraphUrl: DELAY_SUBGRAPH_URL })
    console.log("Connector", connector)

    const app = await organization.connection.orgConnector.appByAddress(organization, DISPUTABLE_DELAY_ADDRESS)
    console.log("App", app)

    disputableDelay = new DisputableDelay(connector, app)
    console.log("DisputableDelay", disputableDelay)
  })

  afterAll(async () => {
    await disputableDelay.disconnect()
  })

  describe('current collateral requirement', () => {
    let collateralRequirement: CollateralRequirement

    beforeEach(async () => {
      collateralRequirement = await disputableDelay.currentCollateralRequirement()
    })

    test.only('has a collateral requirement associated', async () => {
      expect(collateralRequirement.id).toBe(`${DISPUTABLE_DELAY_ADDRESS}-collateral-${collateralRequirement.collateralRequirementId}`)
      expect(collateralRequirement.tokenId).toBe('0x3af6b2f907f0c55f279e0ed65751984e6cdc4a42')
      expect(collateralRequirement.actionAmount).toBe('1000000000000000000')
      expect(collateralRequirement.formattedActionAmount).toBe('1.00')
      expect(collateralRequirement.challengeAmount).toBe('2000000000000000000')
      expect(collateralRequirement.formattedChallengeAmount).toBe('2.00')
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

  describe('delay execution', () => {
    const SCRIPT = '0x00000001'
    const CONTEXT = '0xABCD'
    const SIGNER_ADDRESS = '0x0090aed150056316e37fe6dfa10dc63e79d173b6'

    it('returns a new vote intent', async () => {
      const delayABI = new ethers.utils.Interface(['function delayExecution(bytes,bytes)'])
      const intent = await disputableDelay.delayExecution(SCRIPT, CONTEXT, SIGNER_ADDRESS)

      expect(intent.transactions.length).toBe(1)
      expect(intent.destination.address).toBe(DISPUTABLE_DELAY_ADDRESS)

      const transaction = intent.transactions[0]
      expect(transaction.to.toLowerCase()).toBe(DISPUTABLE_DELAY_ADDRESS)
      expect(transaction.from).toBe(SIGNER_ADDRESS)
      expect(transaction.data).toBe(delayABI.encodeFunctionData('delayExecution', [SCRIPT, ethers.utils.toUtf8Bytes(CONTEXT)]))
    })
  })
})
