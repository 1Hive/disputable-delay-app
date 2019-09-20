import 'core-js/stable'
import 'regenerator-runtime/runtime'
import Aragon, { events } from '@aragon/api'
import delaySettings from './lib/delay-settings'

const app = new Aragon()

initialize()

async function initialize() {
  return createStore()
}

async function createStore(executionDelay) {
  const currentBlock = await getBlockNumber()

  return app.store(
    (state, { event, returnValues, blockNumber }) => {
      //dont want to listen for past events for now
      //(our app state can be obtained from smart contract vars)
      if (blockNumber && blockNumber <= currentBlock) return state

      let nextState = {
        ...state,
      }

      switch (event) {
        case events.ACCOUNTS_TRIGGER:
          return { ...nextState }
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true }
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false }
        case 'DelayedScriptStored':
          return
        case 'ExecutedScript':
          return
        case 'ExecutionPaused':
          return
        case 'WithdrExecutionResumedawal':
          return
        case 'ExecutionCancelled':
          return
        default:
          return state
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
    }
  }
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

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

function getBlockNumber() {
  return new Promise((resolve, reject) =>
    app.web3Eth('getBlockNumber').subscribe(resolve, reject)
  )
}

function marshallDate(date) {
  // Adjust for js time (in ms vs s)
  return parseInt(date, 10) * 1000
}
