let pct16

let tokens, appManager, voting

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports = {
  postDao: async function({ _experimentalAppInstaller, log, dao }, builderRuntimeEnv) {
    const bigExp = (x, y) =>
      builderRuntimeEnv.web3.utils
        .toBN(x)
        .mul(builderRuntimeEnv.web3.utils.toBN(10).pow(builderRuntimeEnv.web3.utils.toBN(y)))
    pct16 = (x) => bigExp(x, 16)

    appManager = (await builderRuntimeEnv.web3.eth.getAccounts())[0]

    const minime = await deployMinimeToken(builderRuntimeEnv)
    await minime.generateTokens(appManager, pct16(100))
    log(`> Minime token deployed: ${minime.address}`)

    tokens = await _experimentalAppInstaller('token-manager', {
      skipInitialize: true
    })

    await minime.changeController(tokens.address)
    log(`> Change minime controller to tokens app`)
    await tokens.initialize([minime.address, true, 0])
    log(`> Tokens app installed: ${tokens.address}`)
    

    voting = await _experimentalAppInstaller('voting', {
      initializeArgs: [
        minime.address,
        pct16(50), // support 50%
        pct16(25), // quorum 15%
        604800, // 7 days
      ],
    })
    log(`> Voting app installed: ${voting.address}`)

    await tokens.createPermission('MINT_ROLE', voting.address)
  },

  getInitParams: async function({}, builderRuntimeEnv) {
    return [
      60 // Delay time in seconds
    ]
  },

  postInit: async function({ proxy }, bre) {
    await voting.createPermission('CREATE_VOTES_ROLE', proxy.address)
  }
}

const deployMinimeToken = async (bre) => {
  const MiniMeTokenFactory = await bre.artifacts.require('MiniMeTokenFactory')
  const MiniMeToken = await bre.artifacts.require('MiniMeToken')
  const factory = await MiniMeTokenFactory.new()
  return await MiniMeToken.new(factory.address, ZERO_ADDRESS, 0, 'MiniMe Test Token', 18, 'MMT', true
  )
}
