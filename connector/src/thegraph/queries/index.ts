import gql from 'graphql-tag'

export const GET_DISPUTABLE_DELAY = (type: string) => gql`
  ${type} DisputableDelay($disputableDelay: String!) {
    disputableDelay(id: $disputableDelay) {
      id
      dao
      agreement
      executionDelay
      delayedScriptsNewIndex
    }
  }
`

export const GET_DELAYED_SCRIPT = (type: string) => gql`
  ${type} DelayedScript($delayedScriptId: String!) {
    delayedScript(id: $delayedScriptId) {
      id
      disputableDelay { 
        id
      }
      delayedScriptId
      executionFromTime
      pausedAt
      delayedScriptStatus
      evmScript
      actionId
      submitter
      context
      disputeId
      challengeId
      challenger
      challengeEndDate
      settledAt
      disputedAt
      executedAt
      submitterArbitratorFee {
        id
      }
      challengerArbitratorFee {
        id
      }
    }
  }
`

export const ALL_DELAYED_SCRIPTS = (type: string) => gql`
  ${type} DelayedScripts($disputableDelay: String!, $first: Int!, $skip: Int!) {
    delayedScripts(where: {
      disputableDelay: $disputableDelay
    }, orderBy: delayedScriptId, orderDirection: asc, first: $first, skip: $skip) {
      id
      disputableDelay { 
        id
      }
      delayedScriptId
      executionFromTime
      pausedAt
      delayedScriptStatus
      evmScript
      actionId
      submitter
      context
      disputeId
      challengeId
      challenger
      challengeEndDate
      settledAt
      disputedAt
      executedAt
      submitterArbitratorFee {
        id
      }
      challengerArbitratorFee {
        id
      }
    }
  }
`

export const GET_CURRENT_COLLATERAL_REQUIREMENT = (type: string) => gql`
    ${type} DisputableDelay($disputableDelay: String!) {
      disputableDelay(id: $disputableDelay) {
        collateralRequirement {
          id
          disputableDelay {
            id
          }
          token {
            id
            decimals
          }
          actionAmount
          challengeAmount
          challengeDuration
          collateralRequirementId
        }
      }
    }
`

export const GET_COLLATERAL_REQUIREMENT = (type: string) => gql`
  ${type} CollateralRequirement($delayedScriptId: String!) {
    delayedScript(id: $delayedScriptId) {
      collateralRequirement {
        id
        collateralRequirementId
        actionAmount
        challengeAmount
        challengeDuration
        delayedScript {
          id
        }
        token {
          id
          decimals
        }
      }
    }
  }
`

export const GET_ARBITRATOR_FEE = (type: string) => gql`
  ${type} ArbitratorFee($arbitratorFeeId: String!) {
    arbitratorFee(id: $arbitratorFeeId) {
      id
      amount
      vote {
        id
      }
      token {
        id
        decimals
      }
    }
  }
`

export const GET_ERC20 = (type: string) => gql`
  ${type} ERC20($tokenAddress: String!) {
    erc20(id: $tokenAddress) {
      id
      name
      symbol
      decimals
    }
  }
`
