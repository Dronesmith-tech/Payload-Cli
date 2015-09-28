# PewPew 
## User Guide

### Using the command line program
1. First, *copy* `Engineering/Software/pewpew/` folder to your local computer.
2. Ensure a telemetry radio is plugged into your respected PC, and make note of its device path (OSX) or COM port number (Windows).
3. If you have not already, [download and install](https://nodejs.org/en/download/) Nodejs. 
4. In your terminal, change to the `repl` directory, and invoke `node pewpew.js <serialdevpath> --repl`. `<serialdevpath>` is the devive path or COM port at which your telemetry radio is located.

If everything works, you should see a message similar to this:
`pew> Connected to serial device.`

You may need to reinstall the node modules depending on your PC and operating system. If you are having node errors that are crashing the program, *ensure* that you are in the root of the `repl` directory, and run `rm -rf node_modules/` to remove the modules directory. Then, run `npm install` to reinstall the modules.

Commands:
	
	status: Shows if the UAV is currently connected or not. If it is not, you must restart the program to reconnect to the drone. (The restart is to resolve any serial-device related issues, keep the ports from lockign up).
	
	exec: Sends a direct command to the PewPew pod. (Note: Update this readme at some point with these commands!)
	
	script: Invoke a JSON script that will run a set of commands at sequence, separate by milliseconds. 
	
	quit/exit: Shut down the repl.
	
You can also execute scripts without runnning the command line by starting the program as `node pewpew.js <serialdevpath> <scriptpath>`. Where `<scriptpath>` is the **fully qualified** file path. 

Script syntax:

	[
		{
			cmd: <String>,
			time: <Number in Milliseconds>	
		},
		{ ... }
	]

Please ensure your script ends with `.json` file extension, as it is in JSON format. The `cmd` string is the raw command to send, and the `time` number is an integer in milliseconds to delay until the next command is invoked. **Please note that the firmware needs at least 10ms of latency between each command.**

### Payload_ctrl and Middleware

QuaRK's Firmware has been modified to include the data marshalling of pewpew. First, there is a new MAVLink message, `SEND_PAYLOAD_CMD` which is broadcasted by pewpew.js to QuaRK. The first two bytes contain the MAV ID and Component ID respectively. *Note* that the firmware is not using these right now, but they were added for future use (such as multiple UAVs). The last 20 bytes contains the raw command string. For example, `2c62w` would be 5 characters, and the next 15 are expected to be 0. It is received by the MAVLink module, which parses it and publishes a new uORB topic called `PAYLOAD_CMD`. 

#### payload_ctrl
payload_ctrl is the name of the task in the firmware that handles sending data to the pewpew pod. The task listens for an updated `PAYLOAD_CMD` topic, and if updated, writes the serial data to the pewpew pod. If needed for debugging, you can view the status of the task by going into the NuttX command line.

	payload_ctrl start: Starts the task. (Already started by default on successful init).
	
	payload_ctrl stop: Shuts down the task.
	
	payload_ctrl status: Shows whether the task is currently running, how many write errors it has and how many reads it has made (will always be 0 right now).
	
payload_ctrl is run once every 10ms.
	
### Pewpew Protocol
Evan TODO...

### Forge?
Frankie TODO...