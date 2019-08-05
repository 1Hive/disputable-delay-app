const Delay = artifacts.require('Delay')
import DaoDeployment from './helpers/DaoDeployment'
import {deployedContract} from './helpers/helpers'

contract('Delay', ([rootAccount, ...accounts]) => {
    let daoDeployment = new DaoDeployment()
    let delayBase, delay

    before(async () => {
        await daoDeployment.deployBefore()

        delayBase = await Delay.new()
    })

    beforeEach(async () => {
        await daoDeployment.deployBeforeEach(rootAccount)
        const newAppReceipt = await daoDeployment.kernel
            .newAppInstance('0x1234', delayBase.address, '0x', false, {from: rootAccount})
        delay = await Delay.at(deployedContract(newAppReceipt))
    })
})