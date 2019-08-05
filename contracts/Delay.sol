pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/common/IForwarder.sol";

// TODO: Update Template app?
contract Delay is AragonApp, IForwarder {

    bytes32 public constant CHANGE_DELAY_ROLE = keccak256("CHANGE_DELAY_ROLE");

    string private constant ERROR_CAN_NOT_EXECUTE = "VOTING_CAN_NOT_EXECUTE";

    struct DelayedScript {
        uint256 timeSubmitted;
        bytes evmCallScript;
    }

    uint256 executionDelay;
    uint256 delayedScriptsNewIndex = 0;
    mapping(uint256 => DelayedScript) delayedScripts;

    event DelayedScriptStored(uint256 scriptId);
    event ExecutedScript(uint256 scriptId);

    function initialize(uint256 _executionDelay) public onlyInit {
        initialized();
        executionDelay = _executionDelay;
    }

    function setExecutionDelay(uint256 _executionDelay) public auth(CHANGE_DELAY_ROLE) {
        executionDelay = _executionDelay;
    }

    function isForwarder() external pure returns (bool) {
        return true;
    }

    function canForward(address _sender, bytes _evmCallScript) public view returns (bool) {
        return true;
    }

    function forward(bytes _evmCallScript) public {
        delayedScripts[delayedScriptsNewIndex] = DelayedScript(now, _evmCallScript);

        emit DelayedScriptStored(delayedScriptsNewIndex);

        delayedScriptsNewIndex++;
    }

    function execute(uint256 _scriptId) external {
        require(canExecute(_scriptId), ERROR_CAN_NOT_EXECUTE);

        bytes memory input = new bytes(0); // TODO: Think about this.
        runScript(delayedScripts[_scriptId].evmCallScript, input, new address[](0));

        delete delayedScripts[_scriptId];

        emit ExecutedScript(_scriptId);
    }

    function canExecute(uint256 _scriptId) public returns (bool) {
        DelayedScript memory delayedScript = delayedScripts[_scriptId]; // TODO: Can we use storage?

        bool withinExecutionWindow = now > delayedScript.timeSubmitted + executionDelay;
        bool notAlreadyExecuted = delayedScript.evmCallScript != new bytes(0); // TODO: Test in remix.

        return notAlreadyExecuted && withinExecutionWindow;
    }

}
