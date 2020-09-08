<br />

## Overview

The Delay app is a [forwarder](https://hack.aragon.org/docs/forwarding-intro). It can delay, pause, and resume forwarding of an intent.

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

## Roles and Permissions

The Delay app has the following roles:

```
bytes32 public constant SET_DELAY_ROLE = keccak256("SET_DELAY_ROLE");
bytes32 public constant DELAY_EXECUTION_ROLE = keccak256("DELAY_EXECUTION_ROLE");
bytes32 public constant PAUSE_EXECUTION_ROLE = keccak256("PAUSE_EXECUTION_ROLE");
bytes32 public constant RESUME_EXECUTION_ROLE = keccak256("RESUME_EXECUTION_ROLE");
bytes32 public constant CANCEL_EXECUTION_ROLE = keccak256("CANCEL_EXECUTION_ROLE");
```

These roles can be set to another Aragon app or an individual address.

## Key Concepts

Key concepts that are non-obvious and/or essential to understanding the architecture of the contract.

### DelayedScript Struct

This is the struct for a delay. It keeps track of the time left until the script can be forwarded / executed, the script to forward / execute, and the time that the script was paused at.

```
struct DelayedScript {
		uint64 executionTime;
		uint64 pausedAt;
		bytes evmCallScript;
}
```

<br />

## Globally Scoped Variables

The following variables are globally scoped within the Delay app.

```
// the default amount of time that the forwarding of an intent will be delayed
uint256 public executionDelay;
// the index of the next created delayedScript struct
uint256 public delayedScriptsNewIndex = 0;
// a mapping of uint256 to an instance of a DelayedScript struct
mapping(uint256 => DelayedScript) public delayedScripts;
```

<br />

## Events

Events are emitted when the following functions are called.

```
// a new `DelayedScript` struct is stored in the `delayedScripts` mapping
event DelayedScriptStored(uint256 scriptId);
// a `DelayedScript` has been executed (and thus is no longer delayed)
event ExecutedScript(uint256 scriptId);
// a `DelayedScript` has been paused
event ExecutionPaused(uint256 scriptId);
// a paused `DelayedScript` has been resumed
event ExecutionResumed(uint256 scriptId);
// a `DelayedScript` has been cancelled
event ExecutionCancelled(uint256 scriptId);
```

<br />

## Modifiers

The `scriptExists` modifier checks that a live (pending future execution) `delayedScript` struct exists.

```
modifier scriptExists(uint256 _scriptId) {
	require(delayedScripts[_scriptId].executionTime != 0, ERROR_NO_SCRIPT);
	_;
}
```

<br />

## Initialization

The Delay app is initialized with the `_executionDelay` parameter. This defines the default length that a user will have to wait to execute a delayed script, provided it is not paused at some point during the delay.

```
/**
* @notice Initialize the Delay app
* @param _executionDelay The delay in seconds a user will have to wait before executing a script
*/
function initialize(uint256 _executionDelay) external onlyInit {
	initialized();
	executionDelay = _executionDelay;
}
```

<br />

## Forwarding

### isForwarder

This makes the Delay app an [Aragon forwarder](https://hack.aragon.org/docs/forwarding-intro).

```
function isForwarder() external pure returns (bool) {
	return true;
}
```

### canForward

This checks if the `_sender` can create delayed forwarding intents via the Delay app.

```
function canForward(address _sender, bytes) public view returns (bool) {
	return canPerform(_sender, DELAY_EXECUTION_ROLE, arr());
}
```

### forward

This allows any address with the `DELAY_EXECUTION_ROLE` to create a delayed intent to forward.

```
/**
* @notice Store script `_evmCallScript` for delayed execution
* @param _evmCallScript The script that can be executed after a delay
*/
function forward(bytes _evmCallScript) public {
	require(canForward(msg.sender, _evmCallScript), ERROR_CAN_NOT_FORWARD);
	_delayExecution(_evmCallScript);
}
```

<br />

## Executing Delayed Scripts

### setExecutionDelay

This sets the global `executionDelay` variable that was set at initialization.

Only addresses that have been given the `SET_DELAY_ROLE` are allowed to set the execution delay.

```
/**
* @notice Set the execution delay to `_executionDelay`
* @param _executionDelay The new execution delay
*/
function setExecutionDelay(uint256 _executionDelay) external auth(SET_DELAY_ROLE) {
	executionDelay = _executionDelay;
}
```

### canExecute

This returns a boolean that tells the caller if a certain `scriptId` can or cannot be executed.

```
/**
* @notice Return whether a script with ID #`_scriptId` can be executed
* @param _scriptId The ID of the script to execute
*/
function canExecute(uint256 _scriptId) public view returns (bool) {
	bool withinExecutionWindow = getTimestamp64() > delayedScripts[_scriptId].executionTime;
	bool isUnpaused = !_isExecutionPaused(_scriptId);

	return withinExecutionWindow && isUnpaused;
}
```

### execute

This checks if the `_delayedScriptId` can be executed (has the delay window passed). If so, then it runs the script and deletes it from the `delayedScripts` mapping.

An event is emitted upon successful execution.

```
/**
* @notice Execute the script with ID `_delayedScriptId`
* @param _delayedScriptId The ID of the script to execute
*/
function execute(uint256 _delayedScriptId) external {
	require(canExecute(_delayedScriptId), ERROR_CAN_NOT_EXECUTE);

	DelayedScript memory delayedScript = delayedScripts[_delayedScriptId];
	delete delayedScripts[_delayedScriptId];

	runScript(delayedScript.evmCallScript, new bytes(0), new address[](0));
	emit ExecutedScript(_delayedScriptId);
}
```

<br />

## Delaying Execution

### delayExecution

This is a wrapper for the `_delayExecution` function. This allows external accounts to forward an intent to delay the execution of a script, but only if they have the `DELAY_EXECUTION_ROLE`.

```
/**
* @notice Store script `_evmCallScript` for delayed execution
* @param _evmCallScript The script that can be executed after a delay
*/
function delayExecution(bytes _evmCallScript) external auth(DELAY_EXECUTION_ROLE) returns (uint256) {
	return _delayExecution(_evmCallScript);
}
```

### \_delayExecution

This is an internal function that is only meant to be called via a wrapper function. These include:

- `delayExecution()` for public accounts that have the `DELAY_EXECUTION_ROLE`
- `forward()` for external contracts (intended for Aragon apps)

This function delays an `_evmCallScript`. It does this by incrementing the `delayedScriptIndex`, then creating a `delayedScript` struct, then adding the `delayedScript` to the array of `delayedScripts` and mapping it to the newly incremented `delayedScriptIndex`. It then emits an event stating the index of the delayed script that was stored.

```
function _delayExecution(bytes _evmCallScript) internal returns (uint256) {
	uint256 delayedScriptIndex = delayedScriptsNewIndex;
	delayedScriptsNewIndex++;

	delayedScripts[delayedScriptIndex] = DelayedScript(now.add(executionDelay) , _evmCallScript, 0);

	emit DelayedScriptStored(delayedScriptIndex);

	return delayedScriptIndex;
}
```

<br />

## Pausing Execution

### \_isExecutionPaused

This returns a boolean that tells the caller if a certain `scriptId` is or is not paused.

```
function _isExecutionPaused(uint256 _scriptId) internal view returns (bool) {
	return delayedScripts[_scriptId].pausedAt != 0;
}
```

### pauseExecution

This allows the caller to pause a `delayedScript` indefinitely.

The caller of this function must have the `PAUSE_EXECUTION_ROLE` and the `_delayedScriptId` must not be already paused.

```
/**
* @notice Pause the script execution with ID `_delayedScriptId`
* @param _delayedScriptId The ID of the script execution to pause
*/
function pauseExecution(uint256 _delayedScriptId) external auth(PAUSE_EXECUTION_ROLE) {
		DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
		require(!_isExecutionPaused(_delayedScriptId), ERROR_CAN_NOT_PAUSE);
		require(getTimestamp64() < delayedScript.executionTime, ERROR_SCRIPT_EXECUTION_PASSED);

		delayedScript.pausedAt = getTimestamp64();

		emit ExecutionPaused(_delayedScriptId);
}
```

<br />

## Resuming Execution

### resumeExecution

This allows an external account (another Aragon app) to resume a paused `delayedScript`.

The caller of this function must have the `RESUME_EXECUTION_ROLE`.

It resumes the script by calculating the time that the `DelayedScript` was paused, adding that amount to the `executionTime`, and then resetting the `pausedAt` parameter to `0`.

An event is emitted upon successful execution.

```
/**
* @notice Resume a paused script execution with ID `_delayedScriptId`
* @param _delayedScriptId The ID of the script execution to resume
*/
function resumeExecution(uint256 _delayedScriptId) external auth(RESUME_EXECUTION_ROLE) {
		require(_isExecutionPaused(_delayedScriptId), ERROR_CAN_NOT_RESUME);
		DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];

		uint64 timePaused = getTimestamp64().sub(delayedScript.pausedAt);
		delayedScript.executionTime = delayedScript.executionTime.add(timePaused);
		delayedScript.pausedAt = 0;

		emit ExecutionResumed(_delayedScriptId);
}
```

<br />

## Cancelling Execution

### cancelExecution

This function cancels a `DelayedScript`. It does this by deleting the `_scriptId` from the contract's `delayedScripts` mapping.

It first checks if the caller has the `CANCEL_EXECUTION_ROLE`. If so then `_cancelExecution()` is called to actually cancel the paused `delayedScript`.

An event is emitted upon successful execution.

```
/**
* @notice Cancel script execution with ID `_delayedScriptId`
* @param _delayedScriptId The ID of the script execution to cancel
*/
function cancelExecution(uint256 _delayedScriptId) external auth(CANCEL_EXECUTION_ROLE) {
		delete delayedScripts[_delayedScriptId];

		emit ExecutionCancelled(_delayedScriptId);
}
```

<br />

## Questions, Comments, and Concerns

If you'd like to talk to us about this contract, please reach out to our dev team. The best place to reach us is the #dev channel on [1Hive Keybase chat](https://1hive.org/contribute/keybase).

<br />
