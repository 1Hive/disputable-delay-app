<br />

## What is the Delay app?

The Delay app is a [forwarder](https://hack.aragon.org/docs/forwarding-intro). It can delay, pause, and resume forwarding of an intent.

<br />

## Using the Delay app

Addresses with the `DELAY_EXECUTION_ROLE` will be able to create delayed actions. 

There are 4 main actions a user can take relative to a script:

- Pause a delayed script
- Resume a delayed script
- Cancel a delayed script
- Execute a delayed script

### Creating a delayed action

In this example we have set up the DAO so the voting app can create delayed actions and the delay app can mint tokens. This menas that when trying to mint some org tokens, you'll have to create a vote first, which if approved, the action will be delayed for 1 minute.

<p align="center">
    <img src="https://raw.githubusercontent.com/1Hive/delay-app/master/docs/resources/delay-script.gif" width="600" />
</p>

### Pause a delayed action

<p align="center">
    <img src="https://raw.githubusercontent.com/1Hive/delay-app/master/docs/resources/pause-script.gif" width="600" />
</p>


### Resume a delayed action

<p align="center">
    <img src="https://raw.githubusercontent.com/1Hive/delay-app/master/docs/resources/resume-script.gif" width="600" />
</p>

### Cancel a delayed action

<p align="center">
    <img src="https://raw.githubusercontent.com/1Hive/delay-app/master/docs/resources/cancel-script.gif" width="600" />
</p>

### Execute a delayed action

<p align="center">
    <img src="https://raw.githubusercontent.com/1Hive/delay-app/master/docs/resources/execute-script.gif" width="600" />
</p>
