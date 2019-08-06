const Promise = require('bluebird')

const assertRevert = async (receiptPromise, reason) => {
    try {
        await receiptPromise
    } catch (error) {
        if (reason) {
            assert.include(error.message, reason, 'Incorrect revert reason')
        }
        return
    }
    assert.fail(`Expected a revert for reason: ${reason}`)
}

const getLog = (receipt, logName, argName) => {
    const log = receipt.logs.find(({event}) => event === logName)
    return log ? log.args[argName] : null
}

const deployedContract = receipt => getLog(receipt, 'NewAppProxy', 'proxy')

const advanceTime = web3 => Promise.promisify(function(delay, done) {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            "method": "evm_increaseTime",
            params: [delay]}, done)
    }
)

module.exports = {
    assertRevert,
    getLog,
    deployedContract,
    advanceTime
}
