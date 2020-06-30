pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/math/SafeMath64.sol";

import "@aragon/os/contracts/apps/disputable/DisputableAragonApp.sol";

/**
 * This app must be the first in a forwarding chain due to being Disputable and it's use of `msg.sender`
 */
contract DisputableDelay is DisputableAragonApp, IForwarder {
    using SafeMath64 for uint64;

    /**
        bytes32 public constant SET_DELAY_ROLE = keccak256("SET_DELAY_ROLE");
        bytes32 public constant DELAY_EXECUTION_ROLE = keccak256("DELAY_EXECUTION_ROLE");
        bytes32 public constant CANCEL_EXECUTION_ROLE = keccak256("CANCEL_EXECUTION_ROLE");
    */
    bytes32 public constant SET_DELAY_ROLE = 0x2b56821903fce674a357ec19f2dd583428c0cc74e6be302c348b3a3ffa5b4f66;
    bytes32 public constant DELAY_EXECUTION_ROLE = 0x68a7ca9b0904e026378fb888f3be95ada2a0c0b11f58c40530c1a383c0f99ce9;
    bytes32 public constant CANCEL_EXECUTION_ROLE = 0x599ee266bc370c66d73339d3e75a02faef68267fcd93a47d7f174caa6026a691;

    string private constant ERROR_NO_SCRIPT = "DELAY_NO_SCRIPT";
    string private constant ERROR_CANNOT_FORWARD = "DELAY_CANNOT_FORWARD";
    string private constant ERROR_CANNOT_EXECUTE = "DELAY_CANNOT_EXECUTE";
    string private constant ERROR_NOT_ACTIVE = "DELAY_NOT_ACTIVE";
    string private constant ERROR_SENDER_CANNOT_CANCEL = "DELAY_SENDER_CANNOT_CANCEL";

    enum DelayedScriptStatus {
        Active,              // A delayed script that has been reported to Agreements
        Paused,              // A delayed script that is being challenged by Agreements
        Cancelled,           // A delayed script that has been cancelled
        Executed             // A delayed script that has been executed
    }

    struct DelayedScript {
        uint64 executionFromTime;
        uint64 pausedAt;
        DelayedScriptStatus delayedScriptStatus;
        bytes evmCallScript;
        uint256 actionId;
        address submitter;
    }

    uint64 public executionDelay;
    uint256 public delayedScriptsNewIndex = 0;
    mapping (uint256 => DelayedScript) public delayedScripts;

    event ExecutionDelaySet(uint64 indexed executionDelay);
    event DelayedScriptStored(uint256 indexed delayedScriptId, uint256 indexed actionId, bytes evmScript);
    event ExecutionPaused(uint256 indexed delayedScriptId, uint256 indexed actionId);
    event ExecutionResumed(uint256 indexed delayedScriptId, uint256 indexed actionId);
    event ExecutionCancelled(uint256 indexed delayedScriptId, uint256 indexed actionId);
    event AgreementActionClosed(uint256 indexed delayedScriptId, uint256 indexed actionId);
    event ExecutedScript(uint256 indexed delayedScriptId, uint256 indexed actionId);

    /**
    * @notice Initialize the Delay app
    * @param _executionDelay The delay in seconds a user will have to wait before executing a script
    */
    function initialize(uint64 _executionDelay) external onlyInit {
        initialized();
        _setExecutionDelay(_executionDelay);
    }

    /**
    * @notice Set the execution delay to `_executionDelay`
    * @param _executionDelay The new execution delay
    */
    function setExecutionDelay(uint64 _executionDelay) external auth(SET_DELAY_ROLE) {
        _setExecutionDelay(_executionDelay);
    }

    /**
    * @dev IDisputable interface conformance
    */
    function canChallenge(uint256 _delayedScriptId) external view returns (bool) {
        return _canPause(delayedScripts[_delayedScriptId]);
    }

    /**
    * @dev IDisputable interface conformance
    */
    function canClose(uint256 _delayedScriptId) external view returns (bool) {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];

        return _canExecute(delayedScript)
            || delayedScript.delayedScriptStatus == DelayedScriptStatus.Cancelled;
    }

    /**
    * @notice Delays execution for `@transformTime(self.executionDelay(): uint)`
    * @param _context Information context for the script being scheduled
    * @param _evmCallScript The script that can be executed after a delay
    */
    function delayExecution(bytes _context, bytes _evmCallScript) external auth(DELAY_EXECUTION_ROLE) returns (uint256) {
        return _delayExecution(_context, _evmCallScript);
    }

    /**
    * @dev IForwarder interface conformance
    */
    function isForwarder() external pure returns (bool) {
        return true;
    }

    /**
    * @dev IForwarder interface conformance
    */
    function canForward(address _sender, bytes) public view returns (bool) {
        return canPerform(_sender, DELAY_EXECUTION_ROLE, arr());
    }

    /**
    * @notice Delays execution for `@transformTime(self.executionDelay(): uint)`
    * @dev IForwarder interface conformance
    * @param _evmCallScript The script that can be executed after a delay
    */
    function forward(bytes _evmCallScript) public {
        require(canForward(msg.sender, _evmCallScript), ERROR_CANNOT_FORWARD);
        _delayExecution(new bytes(0), _evmCallScript);
    }

    /**
    * @dev Challenge script execution, IDisputable interface conformance
    *      Note that this will only be called if Delay.canChallenge() returns true
    * @param _delayedScriptId The ID of the script execution to challenge
    */
    function _onDisputableActionChallenged(uint256 _delayedScriptId, uint256 /* _challengeId */, address /* _challenger */)
        internal
    {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        delayedScript.pausedAt = getTimestamp64();
        delayedScript.delayedScriptStatus = DelayedScriptStatus.Paused;

        emit ExecutionPaused(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @dev Allow script execution, IDisputable interface conformance
    *      Note that either this, _onDisputableActionRejected() or _onDisputableActionVoided()
    *      will be called once for each challenge
    * @param _delayedScriptId The ID of the script execution to allow
    */
    function _onDisputableActionAllowed(uint256 _delayedScriptId) internal {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        uint64 timePaused = getTimestamp64().sub(delayedScript.pausedAt);

        delayedScript.executionFromTime = delayedScript.executionFromTime.add(timePaused);
        delayedScript.pausedAt = 0;
        delayedScript.delayedScriptStatus = DelayedScriptStatus.Active;

        emit ExecutionResumed(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @dev Reject script execution, IDisputable interface conformance
    *      Note that either this, _onDisputableActionAllowed() or _onDisputableActionVoided()
    *      will be called once for each challenge
    * @param _delayedScriptId The ID of the script execution to reject
    */
    function _onDisputableActionRejected(uint256 _delayedScriptId) internal {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];

        delayedScript.delayedScriptStatus = DelayedScriptStatus.Cancelled;

        emit ExecutionCancelled(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @dev Void script execution, IDisputable interface conformance
    *      Note that either this, _onDisputableActionAllowed() or _onDisputableActionRejected()
    *      will be called once for each challenge
    * @param _delayedScriptId The ID of the script execution to void
    */
    function _onDisputableActionVoided(uint256 _delayedScriptId) internal {
        _onDisputableActionAllowed(_delayedScriptId);
    }

    /**
    * @notice Execute the script with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script to execute
    */
    function execute(uint256 _delayedScriptId) external nonReentrant {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        require(_canExecute(delayedScript), ERROR_CANNOT_EXECUTE);

        (,,,,,bool closed,,) = _ensureAgreement().getAction(delayedScript.actionId);
        if (!closed) {
            _closeAgreementAction(delayedScript.actionId);
        }

        delayedScript.delayedScriptStatus = DelayedScriptStatus.Executed;

        address[] memory blacklist = new address[](1);
        blacklist[0] = address(_getAgreement());
        runScript(delayedScript.evmCallScript, new bytes(0), blacklist);

        emit ExecutedScript(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @notice Cancel the script with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script to execute
    */
    function cancelExecution(uint256 _delayedScriptId) external {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];

        bool senderHasPermission = canPerform(msg.sender, CANCEL_EXECUTION_ROLE, new uint256[](0));
        require(delayedScript.submitter == msg.sender || senderHasPermission, ERROR_SENDER_CANNOT_CANCEL);
        require(delayedScript.delayedScriptStatus == DelayedScriptStatus.Active, ERROR_NOT_ACTIVE);

        delayedScript.delayedScriptStatus = DelayedScriptStatus.Cancelled;

        _closeAgreementAction(delayedScript.actionId);

        emit ExecutionCancelled(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @notice Return whether a script with ID #`_scriptId` can be executed
    * @param _delayedScriptId The ID of the script to execute
    */
    function canExecute(uint256 _delayedScriptId) public view returns (bool) {
        return _canExecute(delayedScripts[_delayedScriptId]);
    }

    function _setExecutionDelay(uint64 _executionDelay) internal {
        executionDelay = _executionDelay;
        emit ExecutionDelaySet(_executionDelay);
    }

    function _delayExecution(bytes _context, bytes _evmCallScript) internal returns (uint256) {
        uint256 delayedScriptIndex = delayedScriptsNewIndex;
        delayedScriptsNewIndex++;

        uint256 actionId = _newAgreementAction(delayedScriptIndex, _context, msg.sender);
        delayedScripts[delayedScriptIndex] =
            DelayedScript(getTimestamp64().add(executionDelay), 0, DelayedScriptStatus.Active, _evmCallScript, actionId, msg.sender);

        emit DelayedScriptStored(delayedScriptIndex, actionId, _evmCallScript);
        return delayedScriptIndex;
    }

    function _canPause(DelayedScript storage _delayedScript) internal view returns (bool) {
        bool outsideExecutionWindow = getTimestamp64() < _delayedScript.executionFromTime;
        return _scriptExistsAndActive(_delayedScript) && outsideExecutionWindow;
    }

    function _canExecute(DelayedScript storage _delayedScript) internal view returns (bool) {
        bool withinExecutionWindow = getTimestamp64() >= _delayedScript.executionFromTime;
        return _scriptExistsAndActive(_delayedScript) && withinExecutionWindow;
    }

    function _scriptExistsAndActive(DelayedScript storage _delayedScript) internal view returns (bool) {
        return _delayedScript.executionFromTime != 0
            && _delayedScript.delayedScriptStatus == DelayedScriptStatus.Active;
    }
}
