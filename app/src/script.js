import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'

const app = new Aragon()

initialize()

async function initialize() {
  return createStore()
}

async function createStore() {
  return app.store(
    (state, { event, returnValues }) => {
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
          case 'ChangeExecutionDelay':
            return { ...nextState, executionDelay: returnValues.executionDelay }
          case 'DelayedScriptStored':
            return newScript(nextState, returnValues)
          case 'ExecutionPaused':
            return updateScript(nextState, returnValues)
          case 'ExecutionResumed':
            return updateScript(nextState, returnValues)
          case 'ExecutedScript':
            return removeScript(nextState, returnValues)
          case 'ExecutionCancelled':
            return removeScript(nextState, returnValues)
          default:
            return state
        }
      } catch (err) {
        console.log(err)
      }
    },
    {
      init: initializeState({}),
    }
  )
}

/***********************
 *                     *
 *   Event Handlers    *
 *                     *
 ***********************/

function initializeState(state) {
  return async cachedState => {
    return {
      ...state,
      ...(await getDelaySettings()),
      isSyncing: true,
      delayedScripts: [],
    }
  }
}

async function newScript(state, { scriptId }) {
  const { delayedScripts } = state
  const delayedScript = await getScript(scriptId)

  return {
    ...state,
    delayedScripts: delayedScript.executionTime
      ? [...delayedScripts, delayedScript]
      : [...delayedScripts],
  }
}

async function updateScript(state, { scriptId }) {
  const { delayedScripts } = state
  const index = delayedScripts.findIndex(script => script.scriptId === scriptId)

  const newDelayedScripts =
    index >= 0
      ? [
          ...delayedScripts.slice(0, index),
          await getScript(scriptId),
          ...delayedScripts.slice(index + 1),
        ]
      : [...delayedScripts]

  return {
    ...state,
    delayedScripts: newDelayedScripts,
  }
}

function removeScript(state, { scriptId }) {
  const { delayedScripts } = state
  const index = delayedScripts.findIndex(script => script.scriptId === scriptId)

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

async function getScript(scriptId) {
  const { executionTime, pausedAt, evmCallScript } = await app
    .call('delayedScripts', scriptId)
    .toPromise()

  if (executionTime.toString() === '0') return {}

  let description = ''
  let executionTargets = []

  try {
    const path = await app.describeScript(evmCallScript).toPromise()

    executionTargets = [...new Set(path.map(({ to }) => to))]

    description = path
      ? path
          .map(step => {
            const identifier = step.identifier ? ` (${step.identifier})` : ''
            const app = step.name ? `${step.name}${identifier}` : `${step.to}`

            return `${app}: ${step.description || 'No description'}`
          })
          .join('\n')
      : ''
  } catch (error) {
    console.error('Error describing script', error)
    description = 'Invalid script. The result cannot be executed.'
  }

  return {
    scriptId,
    executionTime: marshallDate(executionTime),
    executionDescription: description,
    executionTargets,
    pausedAt: marshallDate(pausedAt),
  }
}

async function getDelaySettings() {
  const executionDelay = marshallDate(
    await app.call('executionDelay').toPromise()
  )

  return { executionDelay }
}

function marshallDate(date) {
  // Adjust for js time (in ms vs s)
  return parseInt(date, 10) * 1000
}
