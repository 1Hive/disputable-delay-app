import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { formatTime } from './lib/math-utils'
import Aragon, { events } from '@aragon/api'
import { describePath } from './lib/delay-utils'

const app = new Aragon()

initialize()

async function initialize() {
  return createStore()
}

async function createStore() {
  return app.store(
    (state, { event, returnValues, blockNumber, transactionHash }) => {
      const nextState = {
        ...state,
      }

      try {
        switch (event) {
          case events.ACCOUNTS_TRIGGER:
            return { ...nextState }
          case events.SYNC_STATUS_SYNCING:
            return { ...nextState, isSyncing: true }
          case events.SYNC_STATUS_SYNCED:
            return { ...nextState, isSyncing: false }
          case 'ExecutionDelaySet':
            return newExecutionDelay(nextState, returnValues)
          case 'DelayedScriptStored':
            return newDelayedScript(nextState, returnValues, blockNumber, transactionHash)
          case 'ExecutionPaused':
            return updateDelayedScript(nextState, returnValues)
          case 'ExecutionResumed':
            return updateDelayedScript(nextState, returnValues)
          case 'ExecutedScript':
            return removeDelayedScript(nextState, returnValues)
          case 'ExecutionCancelled':
            return removeDelayedScript(nextState, returnValues)
          default:
            return state
        }
      } catch (err) {
        console.log(err)
      }
    },
    {
      init: initializeState(),
    }
  )
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState() {
  return async (cachedState) => {
    const { executionDelay } = await getDelaySettings()

    executionDelay && app.identify(`Delay ${formatTime(executionDelay)}`)
    return {
      ...cachedState,
      executionDelay,
      isSyncing: true,
    }
  }
}

async function newExecutionDelay(state, { executionDelay }) {
  app.identify(`Delay ${formatTime(executionDelay)}`)
  return { ...state, executionDelay }
}

async function newDelayedScript(state, { scriptId }, blockNumber, transactionHash) {
  const { delayedScripts = [] } = state

  const { from: creator } = await app.web3Eth('getTransactionReceipt', transactionHash).toPromise()

  const { timestamp } = await getBlock(blockNumber) // TODO: Move to getDelayedScript (keep in mind that updateScript also calls this function)
  const delayedScript = {
    ...(await getDelayedScript(scriptId, blockNumber)),
    timeSubmitted: marshallDate(timestamp),
    totalTimePaused: 0,
    creator,
  }

  return {
    ...state,
    delayedScripts: delayedScript.executionTime
      ? [...delayedScripts, delayedScript]
      : [...delayedScripts],
  }
}

async function updateDelayedScript(state, { scriptId }) {
  const { delayedScripts } = state
  const index = delayedScripts.findIndex((script) => script.scriptId === scriptId)

  if (index < 0)
    return {
      ...state,
    }

  const oldScript = delayedScripts[index]
  const newScript = await getDelayedScript(scriptId)
  const updatedScript = mergeScripts(oldScript, newScript)

  return {
    ...state,
    delayedScripts: [
      ...delayedScripts.slice(0, index),
      updatedScript,
      ...delayedScripts.slice(index + 1),
    ],
  }
}

function removeDelayedScript(state, { scriptId }) {
  const { delayedScripts } = state
  const index = delayedScripts.findIndex((script) => script.scriptId === scriptId)

  const newDelayedScripts =
    index >= 0
      ? [...delayedScripts.slice(0, index), ...delayedScripts.slice(index + 1)]
      : [...delayedScripts]

  return {
    ...state,
    delayedScripts: newDelayedScripts,
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function getDelayedScript(scriptId) {
  const { executionTime, pausedAt, evmCallScript } = await app
    .call('delayedScripts', scriptId)
    .toPromise()

  if (executionTime === '0') return {}

  let description = ''
  let executionTargets = []
  let path = []

  try {
    path = (await app.describeScript(evmCallScript).toPromise()) || []
    description = describePath(path)
    executionTargets = [...new Set(path.map(({ to }) => to))]
  } catch (error) {
    console.error('Error describing script', error)
  }

  return {
    scriptId,
    executionDescription: description,
    executionTargets,
    executionTime: marshallDate(executionTime),
    pausedAt: marshallDate(pausedAt),
    path,
  }
}

/**
 * @dev function to maintain script time submited and total time paused
 * @param {*} oldScript script before the new event
 * @param {*} newScript script after the new event
 * @returns {object} merged script
 */
function mergeScripts(oldScript, newScript) {
  // We need to keep the time the script was submitted and the total time it was paused for progress bar
  const { timeSubmitted, totalTimePaused, executionTime: oldExecutionTime, creator } =
    oldScript || {}

  // If resumed => timePaused > 0 else timePaused = 0
  const timePaused = newScript.executionTime - oldExecutionTime

  return {
    ...newScript,
    timeSubmitted,
    totalTimePaused: totalTimePaused + timePaused,
    creator,
  }
}

async function getDelaySettings() {
  const executionDelay = await app.call('executionDelay').toPromise()

  return { executionDelay }
}

function getBlock(blockNumber) {
  return app.web3Eth('getBlock', blockNumber).toPromise()
}

function marshallDate(date) {
  // Adjust for js time (in ms vs s)
  return parseInt(date, 10) * 1000
}
