<br />

## Overview

The Delay app is a [forwarder](https://hack.aragon.org/docs/forwarding-intro). It can delay, pause, and resume forwarding of intent.

For example an ACL oracle could be used to allow cancelling transactions if the token supply has decreased by a configurable percentage. This pattern of implementing roles to pause/unpause and cancel pending actions will likely be implemented in other voting and approval related Aragon apps to accommodate dispute resolution processes.

An example of a configuration which creates an internal dispute resolution process is as follows: Some permission can be granted to the delay app, and then the ability to forward an intent and pause can be granted to the lock app. Users can perform actions unilaterally by locking tokens, but anyone can pause the intent, and then a vote would only be required to unpause or cancel the action.

<br />

## Initialization

Info on the initialization parameters.
```
// the exact code that was just described above
```

<br />

## Function 1

Info on the function, it's inputs, any state changes or outputs, and anything else to be aware of.
```
// the exact code that was just described above
```

<br />

## Another Important Function

Info on the function, it's inputs, any state changes or outputs, and anything else to be aware of.
```
// the exact code that was just described above
```

<br />
