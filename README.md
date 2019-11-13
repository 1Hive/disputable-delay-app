# delay-app <img align="right" src="https://github.com/1Hive/website/blob/master/website/static/img/bee.png" height="80px" />

[![CircleCI](https://circleci.com/gh/1Hive/delay-app.svg?style=svg)](https://circleci.com/gh/1Hive/delay-app)
[![Coverage Status](https://coveralls.io/repos/github/1Hive/delay-app/badge.svg?branch=master&service=github)](https://coveralls.io/github/1Hive/delay-app?branch=master&service=github)

1Hive's delay app enables Aragon organizations to require a configurable delay between when an intent is sent and when it is executed.

#### 🐲 Project stage: development

The Delay app is still in development. If you are interested in contributing please see our open [issues](https://github.com/1hive/x-app/issues).

#### 🚨 Security review status: pre-audit

The code in this repo has not been audited.

## How does it work?

The Delay app keeps track of the time left until the script can be forwarded, the script to forward, and the time that the script was paused at.

### Initialization
The Delay app is initialized with the `_executionDealy` parameter. This defines the default length that a user will have to wait to execute a delayed script, provided it is not paused at some point during the delay.

### Roles

The Delay app should implement the following roles:
- `SET_DELAY_ROLE`: This allows for setting a delay.
- `DELAY_EXECUTION_ROLE`: This allows for executing a delay once it is past it's delay window.
- `PAUSE_EXECUTION_ROLE`: This allows for pausing a delay.
- `RESUME_EXECUTION_ROLE`: This allows for resuming a paused delay.
- `CANCEL_EXECUTION_ROLE`: This allows for cancelling a delay.

### Interface

The Delay app does not have a user interface.

## How to run the Delay app locally

The Delay app is used in tandem with other Aragon apps, but you cannot deploy it on it's own.

### Template

If you would like to see the Delay App in action, we recommend the Dandelion Org template available in the Aragon templates directory. Just go to https://preview.1hive.org/, then create a new organization, and choose Dandelion from the template options.

## Aragon DAO Installation

[list Rinkeby or Mainnet APM deployment here]

To deploy to an organization you can use the [aragonCLI](https://hack.aragon.org/docs/cli-intro.html).

```sh
aragon dao install <dao-address> x.open.aragonpm.eth --app-init-args <thing1> <thing2> <thing3>
```

## Contributing

We welcome community contributions!

Please check out our [open Issues](https://github.com/1Hive/delay-app/issues) to get started.

If you discover something that could potentially impact security, please notify us immediately. The quickest way to reach us is via the #dev channel in our [team Keybase chat](https://1hive.org/contribute/keybase). Just say hi and that you discovered a potential security vulnerability and we'll DM you to discuss details.
