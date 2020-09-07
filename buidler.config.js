const { usePlugin } = require('@nomiclabs/buidler/config')
const hooks = require('./scripts/buidler-hooks')

usePlugin('@aragon/buidler-aragon')
usePlugin('@nomiclabs/buidler-solhint')

module.exports = {
  defaultNetwork: 'buidlerevm',
  networks: {
    buidlerevm: {
    },
    localhost: {
      url: 'http://localhost:8545',
      accounts: {
        mnemonic: "explain tackle mirror kit van hammer degree position ginger unfair soup bonus"
      }
    },
    rinkeby: {
      url: 'https://rinkeby.eth.aragon.network',
      accounts: [
        process.env.ETH_KEY ||
        '0xa8a54b2d8197bc0b19bb8a084031be71835580a01e70a45a13babd16c9bc1563',
      ],
      gas: 7.9e6,
      gasPrice: 15000000001
    },
  },
  solc: {
    version: '0.4.24',
    optimizer: {
      enabled: true,
      // Tests need to compile the Agreements contract which requires a lower optimizer runs setting
      runs: process.env.TEST ? 1000 : 10000,
    },
  },
  aragon: {
    appServePort: 3001,
    clientServePort: 3000,
    appSrcPath: 'app/',
    appBuildOutputPath: 'dist/',
    hooks,
  },
}
