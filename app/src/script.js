import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import delaySettings from './lib/delay-settings'

const app = new Aragon()

initialize()

async function initialize() {
  return createStore()
}

async function createStore() {
  return app.store(
    (state, { event, returnValues }) => {
      let nextState = {
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

function initializeState(state, tokenContract) {
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
    delayedScripts:
      delayedScript.executionTime > 0
        ? [...delayedScripts, delayedScript]
        : delayedScripts,
  }
}

async function updateScript(state, { scriptId }) {
  const { delayedScripts } = state
  let index = delayedScripts.findIndex(script => script.id === scriptId)

  return {
    ...state,
    delayedScripts: [
      ...delayedScripts.slice(0, index),
      await getScript(scriptId),
      ...delayedScripts.slice(index + 1),
    ],
  }
}

function removeScript(state, { scriptId }) {
  const { delayedScripts } = state
  let index = delayedScripts.findIndex(script => script.id === scriptId)

  return {
    ...state,
    delayedScripts: [
      ...delayedScripts.slice(0, index),
      ...delayedScripts.slice(index + 1),
    ],
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function getScript(scriptId) {
  const { executionTime, evmCallScript, pausedAt } = await app
    .call('delayedScripts', scriptId)
    .toPromise()
  
  return {
    id: scriptId,
    executionTime: marshallDate(executionTime),
    evmCallScript,
    pausedAt: marshallDate(pausedAt),
  }
}

async function getDelaySettings() {
  return Promise.all(
    delaySettings.map(([name, key, type = 'string']) =>
      app
        .call(name)
        .toPromise()
        .then(val => (type === 'time' ? marshallDate(val) : val))
        .then(value => ({ [key]: value }))
    )
  )
    .then(settings =>
      settings.reduce((acc, setting) => ({ ...acc, ...setting }), {})
    )
    .catch(err => {
      console.error('Failed to load lock settings', err)
      // Return an empty object to try again later
      return {}
    })
}

function marshallDate(date) {
  // Adjust for js time (in ms vs s)
  return parseInt(date, 10) * 1000
}
