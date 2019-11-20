# Delay Installation Guide

This guide will walk you through everything you need to add Delay app to an existing Aragon DAO.

---

## TL;DR

Delay app has been published to the following locations:

- Rinkeby: `delay.open.aragonpm.eth`
- Mainnet: -

To deploy to an organization you can use the [Aragon CLI](https://hack.aragon.org/docs/cli-intro.html).

```sh
aragon dao install <dao-address> delay.open.aragonpm.eth --app-init-args <execution-delay>
```

---

## Detailed Installation Guide

---

### 1. Deploy a fresh DAO

This step is if you don't already have a DAO to install Delay app on, or want to test it on a demo first.

First, make sure that you have the [Aragon CLI](https://hack.aragon.org/docs/cli-intro.html) installed. Then run `aragon devchain` in a terminal. This should show you two Ethereum addresses. The first one has the most permissions and is used to execute commands on the Aragon CLI. Import the private key of that account into Metamask. Then head over to the [Rinkeby DAO launcher](rinkeby.aragon.org) and create a DAO with the democracy kit. Make sure that the Metamask account that is active is the first account created by your `aragon devchain`.

Once your Democracy DAO is deployed (the voting params don't matter as you'll be the only one voting right now), go to the settings tab where you will find the addresses for the DAO and its apps. For legibility of subsequent commands will set bash environment variable for these addresses:

```
dao=0x6604f9fe9Db1D3F6a45d8F0ab79e8a4B05968816
tokens=0x7F42cEB659B944cBB9F3D5ED637f66818C1bAcbf
voting=0x41CA57d1e65Cdcd3A68A0e9f8E835F3a1FeDc655
```

---

### 2. Install Delay app to the DAO

Delay app has been published to the APM on Rinkeby at `delay.open.aragonpm.eth`

```sh
aragon dao install $dao delay.open.aragonpm.eth --app-init-args <delay-execution> --environment aragon:rinkeby
```

If the installation was executed successfully, you should see in you terminal:
`✔ Installed delay.open.aragonpm.eth at: <delay-address>`

The default setup of the democracy DAO is for a vote of the token holders to take place before actions are executed. Head over to the voting app and you will see a new vote.

---

### 3. Set up Permissions

Before the Delay app displays in the UI you must set a permission on it. First, get the address of the Delay app

> In the unlikely case the proxy address of the app did not show in the previous step, then do the following:

```sh
dao apps $dao --all --environment aragon:rinkeby
```

> This will list all apps installed in the dao.

Next, copy the proxy address of the app and create another environment variable `delay=0x4dA76c5B30b5a289Cb8f673Ba71A1A20bd37a00c`

### The following permissions need to be created for the Delay app to function properly:

- SET_DELAY_ROLE
- DELAY_EXECUTION_ROLE
- PAUSE_EXECUTION_ROLE
- RESUME_EXECUTION_ROLE
- CANCEL_EXECUTION_ROLE

After setting one of these roles the Delay app will appear in the UI

We're going to grant the voting app the permission to delay execution of actions and set it also as the controller. Again like the rest of the commands that change state, you must first vote before the action takes affect.

```sh
dao acl create $dao $delay DELAY_EXECUTION_ROLE $voting $voting --environment aragon:rinkeby
```

This grants the voting app the permission to set the delay execution

```sh
dao acl create $dao $delay SET_DELAY_ROLE $voting $voting --environment aragon:rinkeby
```

This grants the tokens app the permission to pause a delayed script.

```sh
dao acl create $dao $delay PAUSE_EXECUTION_ROLE $tokens $voting --environment aragon:rinkeby
```

This grants the voting app the permission to resume a delayed script.

```sh
dao acl create $dao $delay RESUME_EXECUTION_ROLE $voting $voting --environment aragon:rinkeby
```

This grants the tokens app the permission to cancel a delayed script.

```sh
dao acl create $dao $delay CANCEL_EXECUTION_ROLE $tokens $voting --environment aragon:rinkeby
```

---

### Granting the Delay app permissions on other apps

We are going to grant the delay app the permission to mint tokens in the tokens app. This will mean that in order to mint new tokens, a vote will be created. In the case the vote passes and is enacted, the action to mint tokens will be delay by the configured execution delay set in the Delay app.

dao acl create $dao $tokens MINT_ROLE $delay $voting --environment aragon:rinkeby

> Notes:
> if for some reason you're not allowed to create a vote try creating it manually via the GUI in the Aragon Client (system / permissions / Add permission)

---

### 4. Testing Delay app

If all the steps above were done correctly, you should have Delay app all set up.

You can now try to mint some tokens in the tokens app and se how the action is delayed after the approval of a vote.

This is one example of the usage of the Delay app but it is quite flexible and can accomodate to other use cases.
