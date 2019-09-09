import "core-js/stable";
import "regenerator-runtime/runtime";
import Aragon, { events } from "@aragon/api";

const app = new Aragon();

initialize();

async function initialize() {
  return createStore();
}

async function createStore() {
  const currentBlock = await getBlockNumber();

  return app.store(
    (state, { event, returnValues, blockNumber }) => {
      //dont want to listen for past events for now
      //(our app state can be obtained from smart contract vars)
      if (blockNumber && blockNumber <= currentBlock) return state;

      let nextState = {
        ...state
      };

      switch (event) {
        case events.ACCOUNTS_TRIGGER:
          return { ...nextState };
        case events.SYNC_STATUS_SYNCING:
          return { ...nextState, isSyncing: true };
        case events.SYNC_STATUS_SYNCED:
          return { ...nextState, isSyncing: false };
        default:
          return state;
      }
    },
    {
      init: initializeState({})
    }
  );
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
      executionDelay: await getDelaySettings(),
      isSyncing: true
    };
  };
}

/***********************
 *                     *
 *       Helpers       *
 *                     *
 ***********************/

async function getDelaySettings() {
  const delay = await app.call("executionDelay").toPromise();
  console.log("DELAAAAAY ", delay);
  return delay;
}

function getBlockNumber() {
  return new Promise((resolve, reject) =>
    app.web3Eth("getBlockNumber").subscribe(resolve, reject)
  );
}
