const Delay = artifacts.require('MockDelay')
const ExecutionTarget = artifacts.require('ExecutionTarget')

const { assertRevert } = require('@aragon/apps-agreement/test/helpers/assert/assertThrow')
const { ACTIONS_STATE, RULINGS } = require('@aragon/apps-agreement/test/helpers/utils/enums')
const { encodeCallScript } = require('@aragon/contract-test-helpers/evmScript')
const { getEventArgument, getNewProxyAddress } = require('@aragon/contract-test-helpers/events')
const { hash: nameHash } = require('eth-ens-namehash')

const deployer = require('@aragon/apps-agreement/test/helpers/utils/deployer')(web3, artifacts)

const ONE_DAY = 60 * 60 * 24
const ANY_ADDR = '0xffffffffffffffffffffffffffffffffffffffff'
const toBn = (number) => web3.utils.toBN(number)

contract('Delay', ([rootAccount]) => {
  let agreement, collateralToken, delayBase, delay
  let SET_DELAY_ROLE, DELAY_EXECUTION_ROLE, SET_AGREEMENT_ROLE, CHALLENGE_ROLE

  before('deploy base apps', async () => {
    delayBase = await Delay.new()
    agreement = await deployer.deployAndInitializeWrapper({ rootAccount })
    collateralToken = await deployer.deployCollateralToken()
    await agreement.sign(rootAccount)

    SET_AGREEMENT_ROLE = await delayBase.SET_AGREEMENT_ROLE()
    SET_DELAY_ROLE = await delayBase.SET_DELAY_ROLE()
    CHALLENGE_ROLE = await deployer.base.CHALLENGE_ROLE()
    DELAY_EXECUTION_ROLE = await delayBase.DELAY_EXECUTION_ROLE()
  })

  beforeEach('deploy dao and delay', async () => {
    const newDelayAppReceipt =
      await deployer.dao.newAppInstance(nameHash('delay.aragonpm.eth'), delayBase.address, '0x', false, {from: rootAccount,})
    delay = await Delay.at(getNewProxyAddress(newDelayAppReceipt))

    await deployer.acl.createPermission(agreement.address, delay.address, SET_AGREEMENT_ROLE, rootAccount)
    await deployer.acl.createPermission(ANY_ADDR, delay.address, CHALLENGE_ROLE, rootAccount)
    await deployer.acl.createPermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE, rootAccount)
  })

  describe('initialize(uint256 _executionDelay)', () => {
    const INITIAL_DELAY = 100 // seconds

    beforeEach(async () => {
      await delay.initialize(INITIAL_DELAY)
      await agreement.register({ disputable: delay, collateralToken, actionCollateral: 0, challengeCollateral: 0, challengeDuration: INITIAL_DELAY, from: rootAccount })
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
        await deployer.acl.createPermission(rootAccount, delay.address, SET_DELAY_ROLE, rootAccount)
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
        await deployer.acl.revokePermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE)
        assert.isFalse(await delay.canForward(rootAccount, '0x'))
      })
    })

    describe('submit a delayed execution script', () => {
      let executionTarget, script, delayedScriptId, actionId, delayCreatedTimestamp

      beforeEach(async () => {
        executionTarget = await ExecutionTarget.new()
        const action = {
          to: executionTarget.address,
          calldata: executionTarget.contract.methods.execute().encodeABI(),
        }
        script = encodeCallScript([action])
      })

      const itUpdatesExecutionStateCorrectly = () => {

        it('stores delayed execution script and updates new script index', async () => {
          const timestamp = await delay.getTimestampPublic()

          const expectedExecutionTime = timestamp.toNumber() + INITIAL_DELAY
          const {
            executionTime: actualExecutionTime,
            pausedAt: actualPausedAt,
            evmCallScript: actualCallScript,
          } = await delay.delayedScripts(delayedScriptId)
          const actualNewScriptIndex = await delay.delayedScriptsNewIndex()

          assert.closeTo(actualExecutionTime.toNumber(), expectedExecutionTime, 3)
          assert.equal(actualCallScript, script)
          assert.equal(actualPausedAt, 0)
          assert.equal(actualNewScriptIndex, 1)
        })

        describe('getDisputableAction(uint256 _delayedScriptId)', () => {
          it('returns expected values for unexecuted script', async () => {
            const expectedEndDate = delayCreatedTimestamp.add(toBn(INITIAL_DELAY))

            const { endDate, challenged, finished } = await delay.getDisputableAction(delayedScriptId)

            assert.closeTo(endDate.toNumber(), expectedEndDate.toNumber(), 3)
            assert.isFalse(challenged)
            assert.isFalse(finished)
          })

          it('returns expected values for unexecuted challenged script', async () => {
            await agreement.challenge({ actionId })
            const expectedEndDate = delayCreatedTimestamp.add(toBn(INITIAL_DELAY))

            const { endDate, challenged, finished } = await delay.getDisputableAction(delayedScriptId)

            assert.closeTo(endDate.toNumber(), expectedEndDate.toNumber(), 3)
            assert.isTrue(challenged)
            assert.isFalse(finished)
          })

          it('returns expected values for finished script', async () => {
            await agreement.challenge({ actionId })
            await agreement.dispute({ actionId })
            await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_CHALLENGER })

            const { endDate, challenged, finished } = await delay.getDisputableAction(delayedScriptId)

            assert.equal(endDate.toNumber(), 0)
            assert.isFalse(challenged)
            assert.isTrue(finished)
          })
        })

        describe('canChallenge(uint256 _delayedScriptId)', () => {
          it('returns true when script not paused', async () => {
            const canChallenge = await delay.canChallenge(delayedScriptId)
            assert.isTrue(canChallenge)
          })

          it('returns false when script is paused', async () => {
            await agreement.challenge({ actionId })
            const canChallenge = await delay.canChallenge(delayedScriptId)
            assert.isFalse(canChallenge)
          })
        })

        describe('canClose(uint256 _delayedScriptId)', () => {
          it('returns false when script is not executable', async () => {
            const canClose = await delay.canClose(delayedScriptId)
            assert.isFalse(canClose)
          })

          it('returns true when script is executable', async () => {
            await delay.mockIncreaseTime(INITIAL_DELAY)
            const canClose = await delay.canClose(delayedScriptId)
            assert.isTrue(canClose)
          })
        })

        describe('_onDisputableActionChallenged(uint256 _delayedScriptId)', () => {

          it('pauses execution script', async () => {
            const timestamp = await delay.getTimestampPublic()

            await agreement.challenge({ actionId })

            const { pausedAt } = await delay.delayedScripts(delayedScriptId)
            assert.closeTo(pausedAt.toNumber(), timestamp.toNumber(), 3) // Is not exact due to agreement.challenge() executing multiple transactions
          })

          it('reverts when pausing non existent script', async () => {
            const incorrectActionId = 99
            await assertRevert(agreement.challenge({ actionId: incorrectActionId }), 'AGR_ACTION_DOES_NOT_EXIST')
          })

          it('reverts when pausing already paused script execution', async () => {
            await agreement.challenge({ actionId })
            await assertRevert(agreement.challenge({ actionId }), 'AGR_CANNOT_CHALLENGE_ACTION')
          })

          it('reverts when pausing script past execution time', async () => {
            await delay.mockIncreaseTime(INITIAL_DELAY)
            await assertRevert(agreement.challenge({ actionId }), 'AGR_CANNOT_CHALLENGE_ACTION')
          })
        })

        describe('_onDisputableActionAllowed(uint256 _delayedScriptId)', () => {

          it('resumes execution script', async () => {
            const timePaused = 50
            const { executionTime: oldExecutionTime } = await delay.delayedScripts(0)

            await agreement.challenge({ actionId })
            await delay.mockIncreaseTime(timePaused)
            await agreement.dispute({ actionId })
            await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_SUBMITTER })

            const { executionTime: actualExecutionTime, pausedAt: actualPausedAt } = await delay.delayedScripts(0)
            assert.equal(actualPausedAt, 0)
            assert.closeTo(actualExecutionTime.toNumber(), oldExecutionTime.toNumber() + timePaused, 3)
          })

          it('reverts when disputing non existent script', async () => {
            const incorrectActionId = 99
            await assertRevert(agreement.dispute({ actionId }), 'AGR_CANNOT_DISPUTE_ACTION')
          })

          // it('reverts when resuming non paused script execution', async () => {
          //   await agreement.dispute({ actionId })
          //   await assertRevert(agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_SUBMITTER }), 'DELAY_CAN_NOT_RESUME')
          // })
        })

        describe('_onDisputableActionRejected(uint256 _delayedScriptId)', () => {
          it('cancels execution script', async () => {
            await agreement.challenge({ actionId })
            await agreement.dispute({ actionId })
            await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_CHALLENGER })

            const {
              executionTime: actualExecutionTime,
              pausedAt: actualPausedAt,
              evmCallScript: actualCallScript,
            } = await delay.delayedScripts(delayedScriptId)

            assert.equal(actualExecutionTime, 0)
            assert.equal(actualCallScript, null)
            assert.equal(actualPausedAt, 0)
          })

          // it('reverts when script is paused', async () => {
          //
          //   await agreement.challenge({ actionId })
          //   await agreement.dispute({ actionId })
          //   await agreement.dispute({ actionId })
          //   await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_CHALLENGER })
          //
          //   const incorrectScriptId = 99
          //   await assertRevert(delay.cancelExecution(incorrectScriptId), 'DELAY_NO_SCRIPT')
          // })
        })

        describe('execute(uint256 _delayedScriptId)', () => {
          it('executes the script after the delay has elapsed and deletes script', async () => {
            await delay.mockIncreaseTime(INITIAL_DELAY)

            await delay.execute(delayedScriptId)
            const actualExecutionCounter = await executionTarget.counter()
            const {
              executionTime: actualExecutionTime,
              pausedAt: actualPausedAt,
              evmCallScript: actualCallScript,
            } = await delay.delayedScripts(delayedScriptId)
            assert.equal(actualExecutionCounter, 1)
            assert.equal(actualExecutionTime, 0)
            assert.equal(actualCallScript, null)
            assert.equal(actualPausedAt, 0)
          })

          it('executes the script after execution is resumed', async () => {
            await agreement.challenge({ actionId })
            await agreement.dispute({ actionId })
            await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_SUBMITTER })

            await delay.mockIncreaseTime(INITIAL_DELAY)
            await delay.execute(delayedScriptId)
          })

          it('reverts when script does not exist', async () => {
            const incorrectScriptId = 99
            await assertRevert(delay.execute(incorrectScriptId), 'DELAY_NO_SCRIPT')
          })

          it('reverts when executing script before execution time', async () => {
            await assertRevert(delay.execute(delayedScriptId), 'DELAY_CAN_NOT_EXECUTE')
          })

          it('reverts when executing paused script', async () => {
            await agreement.challenge({ actionId })
            await delay.mockIncreaseTime(INITIAL_DELAY)
            await assertRevert(delay.execute(delayedScriptId), 'DELAY_CAN_NOT_EXECUTE')
          })

          it('reverts when executing cancelled script', async () => {
            await agreement.challenge({ actionId })
            await agreement.dispute({ actionId })
            await agreement.executeRuling({ actionId, ruling: RULINGS.IN_FAVOR_OF_CHALLENGER })
            await delay.mockIncreaseTime(INITIAL_DELAY)

            await assertRevert(delay.execute(delayedScriptId), 'DELAY_NO_SCRIPT')
          })

          it('reverts when evmScript reenters delay contract, attempting to execute same script twice', async () => {
            const action = {
              to: delay.address,
              calldata: delay.contract.methods.execute(1).encodeABI(),
            }

            const reenteringScript = encodeCallScript([action])
            const delayReceipt = await delay.delayExecution("0x", reenteringScript)

            const scriptId = getEventArgument(delayReceipt, 'DelayedScriptStored', 'delayedScriptId')

            await delay.mockIncreaseTime(INITIAL_DELAY)
            await assertRevert(delay.execute(scriptId), 'REENTRANCY_REENTRANT_CALL')
          })
        })
      }

      describe('delayExecution(bytes _evmCallScript)', () => {
        beforeEach(async () => {
          delayCreatedTimestamp = await delay.getTimestampPublic()
          const delayExecutionReceipt = await delay.delayExecution("0x", script)
          delayedScriptId = getEventArgument(delayExecutionReceipt, 'DelayedScriptStored', 'delayedScriptId')
          actionId = getEventArgument(delayExecutionReceipt, 'DelayedScriptStored', 'actionId')
        })

        it('reverts when permission revoked', async () => {
          await deployer.acl.revokePermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE)
          await assertRevert(delay.delayExecution("0x", script), 'APP_AUTH_FAILED')
        })

        itUpdatesExecutionStateCorrectly()
      })

      describe('forward(bytes _evmCallScript)', () => {
        beforeEach('create delayed script', async () => {
          delayCreatedTimestamp = await delay.getTimestampPublic()
          const delayExecutionReceipt = await delay.forward(script)
          delayedScriptId = getEventArgument(delayExecutionReceipt, 'DelayedScriptStored', 'delayedScriptId')
          actionId = getEventArgument(delayExecutionReceipt, 'DelayedScriptStored', 'actionId')
        })

        it('reverts when permission revoked', async () => {
          await deployer.acl.revokePermission(rootAccount, delay.address, DELAY_EXECUTION_ROLE)
          await assertRevert(delay.forward(script), 'DELAY_CAN_NOT_FORWARD')
        })

        itUpdatesExecutionStateCorrectly()
      })
    })
  })

  describe('app not initialized', async () => {
    let script

    beforeEach(async () => {
      const executionTarget = await ExecutionTarget.new()
      const action = {
        to: executionTarget.address,
        calldata: executionTarget.contract.methods.execute().encodeABI(),
      }
      script = encodeCallScript([action])
    })

    it('reverts on setting execution delay', async () => {
      await assertRevert(delay.setExecutionDelay(10), "APP_AUTH_FAILED")
    })

    it('reverts on creating delay execution script (delayExecution)', async () => {
      await assertRevert(delay.delayExecution("0x", script), "APP_AUTH_FAILED")
    })

    it('reverts on creating delay execution script (forward)', async () => {
      await assertRevert(delay.forward(script), "DELAY_CAN_NOT_FORWARD")
    })
  })
})
