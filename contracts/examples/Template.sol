/*
 * SPDX-License-Identitifer:    GPL-3.0-or-later
 *
 * This file requires contract dependencies which are licensed as
 * GPL-3.0-or-later, forcing it to also be licensed as such.
 *
 * This is the only file in your project that requires this license and
 * you are free to choose a different license for the rest of the project.
 */

pragma solidity 0.4.24;

import "@aragon/os/contracts/factory/DAOFactory.sol";
import "@aragon/os/contracts/apm/Repo.sol";
import "@aragon/os/contracts/lib/ens/ENS.sol";
import "@aragon/os/contracts/lib/ens/PublicResolver.sol";
import "@aragon/os/contracts/apm/APMNamehash.sol";

import "@aragon/apps-voting/contracts/Voting.sol";
import "@aragon/apps-token-manager/contracts/TokenManager.sol";
import "@aragon/apps-shared-minime/contracts/MiniMeToken.sol";

import "../Delay.sol";


contract TemplateBase is APMNamehash {
    ENS public ens;
    DAOFactory public fac;

    event DeployInstance(address dao);
    event InstalledApp(address appProxy, bytes32 appId);

    constructor(DAOFactory _fac, ENS _ens) public {
        ens = _ens;

        // If no factory is passed, get it from on-chain bare-kit
        if (address(_fac) == address(0)) {
            bytes32 bareKit = apmNamehash("bare-kit");
            fac = TemplateBase(latestVersionAppBase(bareKit)).fac();
        } else {
            fac = _fac;
        }
    }

    function latestVersionAppBase(bytes32 appId) public view returns (address base) {
        Repo repo = Repo(PublicResolver(ens.resolver(appId)).addr(appId));
        (,base,) = repo.getLatest();

        return base;
    }

    function installApp(Kernel dao, bytes32 appId) internal returns (address) {
        address instance = address(dao.newAppInstance(appId, latestVersionAppBase(appId)));
        emit InstalledApp(instance, appId);
        return instance;
    }

    function installDefaultApp(Kernel dao, bytes32 appId) internal returns (address) {
        address instance = address(dao.newAppInstance(appId, latestVersionAppBase(appId), new bytes(0), true));
        emit InstalledApp(instance, appId);
        return instance;
    }
}


contract Template is TemplateBase {
    MiniMeTokenFactory tokenFactory;

    uint64 constant PCT = 10 ** 16;
    address constant ANY_ENTITY = address(-1);

    bytes32 internal DELAY_APP_ID = keccak256(abi.encodePacked(apmNamehash("open"), keccak256("delay")));
    bytes32 internal TOKEN_MANAGER_APP_ID = apmNamehash("token-manager");
    bytes32 internal VOTING_APP_ID = apmNamehash("voting");

    constructor(ENS ens) TemplateBase(DAOFactory(0), ens) public {
        tokenFactory = new MiniMeTokenFactory();
    }

    function newInstance() public {
        Kernel dao = fac.newDAO(this);
        ACL acl = ACL(dao.acl());
        acl.createPermission(this, dao, dao.APP_MANAGER_ROLE(), this);
        address root = msg.sender;

        Delay delay = Delay(installApp(dao, DELAY_APP_ID));
        Voting voting = Voting(installApp(dao, VOTING_APP_ID));
        TokenManager tokenManager = TokenManager(installApp(dao, TOKEN_MANAGER_APP_ID));

        MiniMeToken token = tokenFactory.createCloneToken(MiniMeToken(0), 0, "App token", 0, "APP", true);
        token.changeController(tokenManager);

        delay.initialize(60);
        tokenManager.initialize(token, true, 0);
        voting.initialize(token, 50 * PCT, 20 * PCT, 1 days);

        acl.createPermission(this, tokenManager, tokenManager.MINT_ROLE(), this);
        tokenManager.mint(root, 1); // Give one token to root

        acl.createPermission(delay, voting, voting.CREATE_VOTES_ROLE(), root);

        acl.createPermission(root, delay, delay.SET_DELAY_ROLE(), root);
        acl.createPermission(ANY_ENTITY, delay, delay.DELAY_EXECUTION_ROLE(), root);
        acl.createPermission(root, delay, delay.PAUSE_EXECUTION_ROLE(), root);
        acl.createPermission(root, delay, delay.RESUME_EXECUTION_ROLE(), root);
        acl.createPermission(root, delay, delay.CANCEL_EXECUTION_ROLE(), root);

        // Clean up permissions
        acl.grantPermission(root, dao, dao.APP_MANAGER_ROLE());
        acl.revokePermission(this, dao, dao.APP_MANAGER_ROLE());
        acl.setPermissionManager(root, dao, dao.APP_MANAGER_ROLE());

        acl.grantPermission(root, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.revokePermission(this, acl, acl.CREATE_PERMISSIONS_ROLE());
        acl.setPermissionManager(root, acl, acl.CREATE_PERMISSIONS_ROLE());

        acl.grantPermission(voting, tokenManager, tokenManager.MINT_ROLE());
        acl.revokePermission(this, tokenManager, tokenManager.MINT_ROLE());
        acl.setPermissionManager(root, tokenManager, tokenManager.MINT_ROLE());

        emit DeployInstance(dao);
    }
}
