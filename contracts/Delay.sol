pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";

contract Delay is AragonApp, IForwarder {

    bytes32 public constant SET_DELAY_ROLE = keccak256("SET_DELAY_ROLE");
    bytes32 public constant DELAY_EXECUTION_ROLE = keccak256("DELAY_EXECUTION_ROLE");

    string private constant ERROR_CAN_NOT_EXECUTE = "DELAY_CAN_NOT_EXECUTE";
    string private constant ERROR_CAN_NOT_FORWARD = "DELAY_CAN_NOT_FORWARD";

    struct DelayedScript {
        uint256 timeSubmitted;
        bytes evmCallScript;
    }

    uint256 executionDelay;
    uint256 delayedScriptsNewIndex = 0;
    mapping(uint256 => DelayedScript) delayedScripts;

    event DelayedScriptStored(uint256 scriptId);
    event ExecutedScript(uint256 scriptId);

    /**
    * @notice Initialize the Delay app
    * @param _executionDelay The delay in seconds a user will have to wait before executing a script
    */
    function initialize(uint256 _executionDelay) public onlyInit {
        initialized();
        executionDelay = _executionDelay;
    }

    /**
    * @notice Set the execution delay to `_executionDelay`
    * @param _executionDelay The new execution delay
    */
    function setExecutionDelay(uint256 _executionDelay) public auth(SET_DELAY_ROLE) {
        executionDelay = _executionDelay;
    }

    /**
    * @notice Store script `_evmCallScript` for delayed execution
    * @param _evmCallScript The script that can be executed after a delay
    */
    function delayExecution(bytes _evmCallScript) external auth(DELAY_EXECUTION_ROLE) returns (uint256) {
        return _delayExecution(_evmCallScript);
    }

    function isForwarder() external pure returns (bool) {
        return true;
    }

    function canForward(address _sender, bytes _evmCallScript) public view returns (bool) {
        return canPerform(_sender, DELAY_EXECUTION_ROLE, arr());
    }

    /**
    * @notice Store script `_evmCallScript` for delayed execution
    * @param _evmCallScript The script that can be executed after a delay
    */
    function forward(bytes _evmCallScript) public {
        require(canForward(msg.sender, _evmCallScript), ERROR_CAN_NOT_FORWARD);
        _delayExecution(_evmCallScript);
    }

    function _delayExecution(bytes _evmCallScript) internal returns (uint256) {
        uint256 delayedScriptIndex = delayedScriptsNewIndex;
        delayedScriptsNewIndex++;

        delayedScripts[delayedScriptIndex] = DelayedScript(now, _evmCallScript);

        emit DelayedScriptStored(delayedScriptIndex);

        return delayedScriptIndex;
    }

    /**
    * @notice Execute the script with ID `_delayedScriptId`
    * @param _delayedScriptId The ID of the script to execute
    */
    function execute(uint256 _delayedScriptId) external {
        require(canExecute(_delayedScriptId), ERROR_CAN_NOT_EXECUTE);

        runScript(delayedScripts[_delayedScriptId].evmCallScript, new bytes(0), new address[](0));

        delete delayedScripts[_delayedScriptId];

        emit ExecutedScript(_delayedScriptId);
    }

    function canExecute(uint256 _scriptId) public returns (bool) {
        DelayedScript storage delayedScript = delayedScripts[_scriptId];

        bool delayedScriptExists = delayedScript.timeSubmitted != 0;
        bool withinExecutionWindow = now > delayedScript.timeSubmitted + executionDelay;

        return delayedScriptExists && withinExecutionWindow;
    }

}
