import 'core-js/stable'
import 'regenerator-runtime/runtime'
import AragonApi from '@aragon/api'

const api = new AragonApi()

const initialState = async (state) => ({
    count: await getValue()
})

api.store(
    async (state, event) => {
        let newState

        switch (event.event) {
            case 'Increment':
                newState = {count: await getValue()}
                break
            case 'Decrement':
                newState = {count: await getValue()}
                break
            default:
                newState = state
        }

        return newState
    },
    {
        init: initialState
    }
)

async function getValue() {
    return parseInt(await api.call('value').toPromise(), 10)
}
