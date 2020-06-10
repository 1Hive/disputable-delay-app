pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";
import "@aragon/os/contracts/lib/math/SafeMath64.sol";

import "@aragon/os/contracts/apps/disputable/DisputableAragonApp.sol";

/*
TODO: Remove the below once UI is updated.
Possible states:
Normal
Paused (independently of Agreements)
Challenged (also Paused)
Executable
Closed (also Executable and Agreement action closed)
Executed (also Closed, determined by searching for ID in ExecutedScript event)
Cancelled (also Closed, determined by searching for ID in ExecutionCancelled event)
*/

contract Delay is DisputableAragonApp, IForwarder {
    using SafeMath64 for uint64;

    /**
        bytes32 public constant SET_DELAY_ROLE = keccak256("SET_DELAY_ROLE");
        bytes32 public constant DELAY_EXECUTION_ROLE = keccak256("DELAY_EXECUTION_ROLE");
        bytes32 public constant PAUSE_EXECUTION_ROLE = keccak256("PAUSE_EXECUTION_ROLE");
        bytes32 public constant RESUME_EXECUTION_ROLE = keccak256("RESUME_EXECUTION_ROLE");
        bytes32 public constant CANCEL_EXECUTION_ROLE = keccak256("CANCEL_EXECUTION_ROLE");
    */
    bytes32 public constant SET_DELAY_ROLE = 0x2b56821903fce674a357ec19f2dd583428c0cc74e6be302c348b3a3ffa5b4f66;
    bytes32 public constant DELAY_EXECUTION_ROLE = 0x68a7ca9b0904e026378fb888f3be95ada2a0c0b11f58c40530c1a383c0f99ce9;
    bytes32 public constant PAUSE_EXECUTION_ROLE = 0x70681eddbe06fae8379b18286b311d77aba3903f7caaacdad8a279edc9bf01dd;
    bytes32 public constant RESUME_EXECUTION_ROLE = 0x6f25a60ae3c6f6d35322e95181c8564827784f1b05dd70ddf7e573f0d62fd84e;
    bytes32 public constant CANCEL_EXECUTION_ROLE = 0x599ee266bc370c66d73339d3e75a02faef68267fcd93a47d7f174caa6026a691;

    string private constant ERROR_NO_SCRIPT = "DELAY_NO_SCRIPT";
    string private constant ERROR_SCRIPT_NOT_PAUSED = "DELAY_SCRIPT_NOT_PAUSED";
    string private constant ERROR_ACTION_NOT_ACTIVE = "DELAY_ACTION_NOT_ACTIVE";
    string private constant ERROR_ACTION_CLOSED = "DELAY_ACTION_CLOSED";
    string private constant ERROR_ACTION_CHALLENGED = "DELAY_ACTION_CHALLENGED";
    string private constant ERROR_CAN_NOT_EXECUTE = "DELAY_CAN_NOT_EXECUTE";
    string private constant ERROR_CAN_NOT_PAUSE = "DELAY_CAN_NOT_PAUSE";
//    string private constant ERROR_SCRIPT_EXECUTION_PASSED = "DELAY_SCRIPT_EXECUTION_PASSED"; // TODO: No longer used, update in tests.
    string private constant ERROR_CAN_NOT_RESUME = "DELAY_CAN_NOT_RESUME";
    string private constant ERROR_CAN_NOT_FORWARD = "DELAY_CAN_NOT_FORWARD";

    enum DisputableStatus {
        Active,              // A delayed script that has been reported to the Agreement
        Challenged,          // A delayed script that is being challenged
        Closed               // A delayed script that has had its agreement action closed
    }

    struct DelayedScript {
        uint64 executionTime;
        uint64 pausedAt;
        bytes evmCallScript;
        uint256 actionId;
        DisputableStatus disputableStatus;
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

    modifier scriptExists(DelayedScript storage _delayedScript) {
        require(_scriptExists(_delayedScript), ERROR_NO_SCRIPT);
        _;
    }

    /**
    * @notice Initialize the Delay app
    * @param _executionDelay The delay in seconds a user will have to wait before executing a script
    */
    function initialize(uint64 _executionDelay) external onlyInit {
        initialized();
        executionDelay = _executionDelay;
    }

    /**
    * @notice Set the execution delay to `_executionDelay`
    * @param _executionDelay The new execution delay
    */
    function setExecutionDelay(uint64 _executionDelay) external auth(SET_DELAY_ROLE) {
        executionDelay = _executionDelay;

        emit ExecutionDelaySet(executionDelay);
    }

    /**
    * @dev IDisputable interface conformance
    */
    function getDisputableAction(uint256 _delayedScriptId) external view returns (uint64 endDate, bool challenged, bool finished) {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        endDate = delayedScript.executionTime;
        challenged = delayedScript.disputableStatus == DisputableStatus.Challenged;
        finished = !_scriptExists(delayedScript);
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
        return _canExecute(delayedScripts[_delayedScriptId]);
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
    * @notice Pause the script execution with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script execution to pause
    */
    function pauseExecution(uint256 _delayedScriptId) external auth(PAUSE_EXECUTION_ROLE) {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        _pauseExecution(delayedScript);
        emit ExecutionPaused(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @notice Resume a paused script execution with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script execution to resume
    */
    function resumeExecution(uint256 _delayedScriptId) external auth(RESUME_EXECUTION_ROLE) {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        require(delayedScript.disputableStatus == DisputableStatus.Active, ERROR_ACTION_NOT_ACTIVE);

        _resumeExecution(delayedScript);
        emit ExecutionResumed(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @notice Cancel script execution with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script execution to cancel
    */
    function cancelExecution(uint256 _delayedScriptId)
        external
        nonReentrant
        auth(CANCEL_EXECUTION_ROLE)
    {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        require(_scriptExists(delayedScript), ERROR_NO_SCRIPT);
        require(delayedScript.disputableStatus != DisputableStatus.Challenged, ERROR_ACTION_CHALLENGED);

        _closeAgreementAction(delayedScript.actionId);

        emit ExecutionCancelled(_delayedScriptId, delayedScript.actionId);
        _deleteDelayedScript(_delayedScriptId);
    }

    /**
    * @notice Execute the script with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script to execute
    */
    function execute(uint256 _delayedScriptId) external nonReentrant {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        require(_canExecute(delayedScript), ERROR_CAN_NOT_EXECUTE);

        runScript(delayedScript.evmCallScript, new bytes(0), new address[](0));

        if (delayedScript.disputableStatus != DisputableStatus.Closed) {
            _closeAgreementAction(delayedScript.actionId);
        }

        emit ExecutedScript(_delayedScriptId, delayedScript.actionId);
        _deleteDelayedScript(_delayedScriptId);
    }

    /**
    * @notice Close agreement action with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script to close the agreement action of
    */
    function closeAgreementAction(uint256 _delayedScriptId) external {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];

        require(_canExecute(delayedScript), ERROR_CAN_NOT_EXECUTE);
        require(delayedScript.disputableStatus != DisputableStatus.Closed, ERROR_ACTION_CLOSED);

        _closeAgreementAction(delayedScript.actionId);
        emit AgreementActionClosed(_delayedScriptId, delayedScript.actionId);

        delayedScript.disputableStatus = DisputableStatus.Closed;
    }

    /**
    * @notice Return whether a script with ID #`_scriptId` can be executed
    * @param _delayedScriptId The ID of the script to execute
    */
    function canExecute(uint256 _delayedScriptId) public view returns (bool) {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        return _canExecute(delayedScript);
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
        require(canForward(msg.sender, _evmCallScript), ERROR_CAN_NOT_FORWARD);
        _delayExecution(new bytes(0), _evmCallScript);
    }

    /**
    * @dev Challenge script execution, IDisputable interface conformance
    * @param _delayedScriptId The ID of the script execution to challenge
    */
    function _onDisputableActionChallenged(uint256 _delayedScriptId, uint256 /* _challengeId */, address /* _challenger */) internal {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        delayedScript.disputableStatus = DisputableStatus.Challenged;
        _pauseExecution(delayedScript);
        emit ExecutionPaused(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @dev Allow script execution, IDisputable interface conformance
    * @param _delayedScriptId The ID of the script execution to allow
    */
    function _onDisputableActionAllowed(uint256 _delayedScriptId) internal {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        delayedScript.disputableStatus = DisputableStatus.Active;
        _resumeExecution(delayedScript);
        emit ExecutionResumed(_delayedScriptId, delayedScript.actionId);
    }

    /**
    * @dev Reject script execution, IDisputable interface conformance
    * @param _delayedScriptId The ID of the script execution to reject
    */
    function _onDisputableActionRejected(uint256 _delayedScriptId) internal {
        DelayedScript storage delayedScript = delayedScripts[_delayedScriptId];
        require(_isExecutionPaused(delayedScript), ERROR_SCRIPT_NOT_PAUSED);

        emit ExecutionCancelled(_delayedScriptId, delayedScript.actionId);
        _deleteDelayedScript(_delayedScriptId);
    }

    /**
    * @dev Void script execution, IDisputable interface conformance
    * @param _delayedScriptId The ID of the script execution to void
    */
    function _onDisputableActionVoided(uint256 _delayedScriptId) internal {
        _onDisputableActionAllowed(_delayedScriptId);
    }

    function _delayExecution(bytes _context, bytes _evmCallScript) internal returns (uint256) {
        uint256 delayedScriptIndex = delayedScriptsNewIndex;
        delayedScriptsNewIndex++;

        uint256 actionId = _newAgreementAction(delayedScriptIndex, _context, msg.sender);
        delayedScripts[delayedScriptIndex] = DelayedScript(getTimestamp64().add(executionDelay), 0, _evmCallScript, actionId, DisputableStatus.Active);

        emit DelayedScriptStored(delayedScriptIndex, actionId, _evmCallScript);
        return delayedScriptIndex;
    }

    function _pauseExecution(DelayedScript storage _delayedScript) internal {
        require(_canPause(_delayedScript), ERROR_CAN_NOT_PAUSE);

        _delayedScript.pausedAt = getTimestamp64();
    }

    function _resumeExecution(DelayedScript storage _delayedScript) internal {
        require(_isExecutionPaused(_delayedScript), ERROR_CAN_NOT_RESUME);

        uint64 timePaused = getTimestamp64().sub(_delayedScript.pausedAt);
        _delayedScript.executionTime = _delayedScript.executionTime.add(timePaused);
        _delayedScript.pausedAt = 0;
    }

    function _deleteDelayedScript(uint256 _delayedScriptId) internal {
        delete delayedScripts[_delayedScriptId];
    }

    function _canPause(DelayedScript storage _delayedScript) internal view returns (bool) {
        bool notPaused = !_isExecutionPaused(_delayedScript);
        bool outsideExecutionWindow = getTimestamp64() < _delayedScript.executionTime;

        return notPaused && outsideExecutionWindow;
    }

    function _canExecute(DelayedScript storage _delayedScript) internal view returns (bool) {
        bool withinExecutionWindow = getTimestamp64() > _delayedScript.executionTime;
        bool notPaused = !_isExecutionPaused(_delayedScript);

        return withinExecutionWindow && notPaused;
    }

    function _isExecutionPaused(DelayedScript storage _delayedScript) internal view scriptExists(_delayedScript) returns (bool) {
        return _delayedScript.pausedAt != 0;
    }

    function _scriptExists(DelayedScript storage _delayedScript) internal view returns (bool) {
        return _delayedScript.executionTime != 0;
    }
}
