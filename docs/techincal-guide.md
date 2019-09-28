<br />

## Overview

The Delay app is a [forwarder](https://hack.aragon.org/docs/forwarding-intro). It can delay, pause, and resume forwarding of intent.

For example an ACL oracle could be used to allow cancelling transactions if the token supply has decreased by a configurable percentage. This pattern of implementing roles to pause/unpause and cancel pending actions will likely be implemented in other voting and approval related Aragon apps to accommodate dispute resolution processes.

An example of a configuration which creates an internal dispute resolution process is as follows: Some permission can be granted to the delay app, and then the ability to forward an intent and pause can be granted to the lock app. Users can perform actions unilaterally by locking tokens, but anyone can pause the intent, and then a vote would only be required to unpause or cancel the action.

<br />

## External Contract Dependencies

The Delay app relies on the following external libraries.

### Audited External Contracts

```
import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";
```

These contracts have been audited by 3rd parties. Information on past Aragon audits can be found at the following locations:
- https://github.com/aragon/security-review/blob/master/past-reports.md
- https://wiki.aragon.org/association/security/

<br />

## Globally Scoped Variables

Copypasta the contract's constants. Then explain each one with a code comment.
```
```

<br />

## Key Concepts

Key concepts that are non-obvious and/or essential to understanding the architecture of the contract.

### DelayedScript Struct

This is the struct for a delay. It keeps track of the time left until the script can be forwarded, the script to forward, and the time that the script was paused at.
```
struct DelayedScript {
		uint256 executionTime;
		bytes evmCallScript;
		uint256 pausedAt;
}
```

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

## Questions, Comments, and Concerns

If you'd like to talk to us about this contract, please reach out to our [insert team chat channel here].

<br />
