const Delay = artifacts.require('Delay')
const ExecutionTarget = artifacts.require('ExecutionTarget')
import DaoDeployment from './helpers/DaoDeployment'
import { deployedContract, assertRevert, timeTravel } from './helpers/helpers'
import { encodeCallScript } from '@aragon/test-helpers/evmScript'

contract('Delay', ([rootAccount, ...accounts]) => {
  let daoDeployment = new DaoDeployment()
  let delayBase, delay
  let SET_DELAY_ROLE, DELAY_EXECUTION_ROLE

  before(async () => {
    await daoDeployment.deployBefore()

    delayBase = await Delay.new()
    SET_DELAY_ROLE = await delayBase.SET_DELAY_ROLE()
    DELAY_EXECUTION_ROLE = await delayBase.DELAY_EXECUTION_ROLE()
  })

  beforeEach(async () => {
    await daoDeployment.deployBeforeEach(rootAccount)
    const newAppReceipt = await daoDeployment.kernel.newAppInstance('0x1234', delayBase.address, '0x', false, {
      from: rootAccount,
    })
    delay = await Delay.at(deployedContract(newAppReceipt))

    await daoDeployment.acl.createPermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE, rootAccount)
  })

  describe('initialize(uint256 _executionDelay)', () => {
    const INITIAL_DELAY = 100 // seconds

    beforeEach(async () => {
      await delay.initialize(INITIAL_DELAY)
    })

    it('sets the initial delay correctly and initializes', async () => {
      const actualExecutionDelay = await delay.executionDelay()
      const hasInitialized = await delay.hasInitialized()
      assert.equal(actualExecutionDelay, INITIAL_DELAY)
      assert.isTrue(hasInitialized)
    })

    it('delay app is a forwarder', async () => {
      assert.isTrue(await delay.isForwarder())
    })

    describe('setExecutionDelay(uint256 _executionDelay)', () => {
      it('sets the execution delay correctly', async () => {
        await daoDeployment.acl.createPermission(rootAccount, delay.address, SET_DELAY_ROLE, rootAccount)
        const expectedExecutionDelay = 20

        await delay.setExecutionDelay(expectedExecutionDelay)

        const actualExecutionDelay = await delay.executionDelay()
        assert.equal(actualExecutionDelay, expectedExecutionDelay)
      })
    })

    describe('canForward(address _sender, bytes _evmCallScript)', () => {
      it('returns true when permission has been set', async () => {
        assert.isTrue(await delay.canForward(rootAccount, '0x'))
      })

      it('returns false when permission has been revoked', async () => {
        await daoDeployment.acl.revokePermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE)
        assert.isFalse(await delay.canForward(rootAccount, '0x'))
      })
    })

    describe('submit a delayed execution script', () => {
      let executionTarget, script

      beforeEach(async () => {
        executionTarget = await ExecutionTarget.new()
        const action = {
          to: executionTarget.address,
          calldata: executionTarget.contract.methods.execute().encodeABI(),
        }
        script = encodeCallScript([action])
      })

      describe('delayExecution(bytes _evmCallScript)', () => {
        beforeEach(async () => {
          await delay.delayExecution(script)
        })

        it('stores delayed execution script and updates new script index', async () => {
          const { timestamp } = await web3.eth.getBlock('latest')
          const expectedExecutionTime = timestamp + INITIAL_DELAY

          const { executionTime: actualExecutionTime, evmCallScript: actualCallScript } = await delay.delayedScripts(0)
          const actualNewScriptIndex = await delay.delayedScriptsNewIndex()

          assert.closeTo(actualExecutionTime.toNumber(), expectedExecutionTime, 3)
          assert.equal(actualCallScript, script)
          assert.equal(actualNewScriptIndex, 1)
        })

        describe('execute(uint256 _delayedScriptId)', () => {
          it('executes the script after the delay has elapsed and deletes script', async () => {
            await advanceTime(web3)(INITIAL_DELAY + 3)

            await delay.execute(0)
            const actualExecutionCounter = await executionTarget.counter()
            const { executionTime: actualExecutionTime, evmCallScript: actualCallScript } = await delay.delayedScripts(
              0
            )
            assert.equal(actualExecutionCounter, 1)
            assert.equal(actualExecutionTime, 0)
            assert.equal(actualCallScript, null)
          })
        })
      })

      describe('forward(bytes _evmCallScript)', () => {
        it('stores delayed execution script and updates new script index when permission granted', async () => {
          await delay.forward(script)

          const { timestamp } = await web3.eth.getBlock('latest')
          const expectedExecutionTime = timestamp + INITIAL_DELAY
          const {
            executionTime: actualExecutionTime,
            evmCallScript: actualCallScript,
            timePaused: actualTimePaused,
          } = await delay.delayedScripts(0)
          const actualNewScriptIndex = await delay.delayedScriptsNewIndex()

          assert.closeTo(actualExecutionTime.toNumber(), expectedExecutionTime, 3)
          assert.equal(actualCallScript, script)
          assert.equal(actualTimePaused, 0)
          assert.equal(actualNewScriptIndex, 1)
        })

        it('reverts when permission revoked', async () => {
          await daoDeployment.acl.revokePermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE)

          const forwardReceipt = delay.forward(script)

          await assertRevert(forwardReceipt, 'DELAY_CAN_NOT_FORWARD')
        })
      })
    })
  })
})
