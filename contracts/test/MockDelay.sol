pragma solidity ^0.4.24;

import "../DisputableDelay.sol";
import "@aragon/contract-helpers-test/contracts/TimeHelpersMock.sol";

contract MockDisputableDelay is DisputableDelay, TimeHelpersMock {}
